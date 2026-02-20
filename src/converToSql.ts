import type { DbMap, DbTable, PgConn } from "./DataType.ts";
import { executePgSql } from "./execSql.js";

export function convertExcelToSql(text: string): string {
  const { result, dbConns } = excelToDbMap(text);

  const sqlMap = dbMapToInsertSql(result);

  for (const db of Object.keys(dbConns)) {
    if (sqlMap[db]) {
      executePgSql(dbConns[db], sqlMap[db]).catch(e => {
        console.error(`Error executing SQL for db ${db}:`, e);
      });
    }
  }
  
  return '\n' 
    + Object.values(sqlMap).map(v => String(v)).join('\n\n\n')
    + '\n';
}

function excelToDbMap(input: string): { result: DbMap; dbConns: Record<string, PgConn> } {
  const lines = (input+'\ntable')
    .split(/\r?\n/)
    // .map(l => l.trimEnd())
    .filter(l => l.length);
  // const lines = input
  //   .split(/\r?\n/)
  //   .map(l => l.replace(/\r/g, ""))
  //   .filter(l => l.replace(/\t/g, "").trim().length > 0);

  const result: DbMap = {};

  const dbConns: Record<string, PgConn> = {};

  let i = 0;

  let tables: Record<string,string> = {};
  let cols: Record<string,string[]> = {};
  let rows:string[][] = [];

  let isOver = false;

  while (i < lines.length+1) {

    // ----- db connection lines
    if (lines[i]?.startsWith("db")) {
      const parts = lines[i].split("\t");

      const db = parts[0].replace("db", "index");

      const conn: any = {};

      parts.slice(1).forEach(p => {
        const [k, v] = p.split("=");
        conn[k] = v;
      });

      dbConns[db] = {
        host: conn.host,
        port: Number(conn.port || 5432),
        user: conn.user,
        password: conn.password,
        database: conn.database
      };

      i++;
      continue;
    }

    // ----- tables
    if (lines[i]?.startsWith("table")) {

      // ----- build dbmap
      if (isOver) {
        for (const db of Object.keys(cols)) {
          // if (!Object.keys(tables).length) {
          //   Object.keys(cols).forEach(k => tables[k] = "untable");
          // }

          const columns = cols[db];
          const table = tables[db];

          let dbTable: DbTable = {
            table,
            columns,
            data: [...rows]
          };

          dbTable = escapeValue(dbTable);

          if (!result[db]) {
            result[db] = [dbTable];
          } else {
            result[db].push(dbTable);
          }
        }
        tables = {};
        cols = {};
        rows = [];
        isOver = false;
      }

      const [k,v] = lines[i].split("\t");
      tables[k.replace("table","index")] = v || "untable";
      i++;
      continue;
    }

    // ----- cols
    if (lines[i]?.startsWith("col")) {
      const parts = lines[i].split("\t");
      cols[parts[0].replace("col","index")] = parts.slice(1);
      i++;
      continue;
    }

    // ----- data
    if (lines[i]?.startsWith("data")) {
      rows.push(lines[i].split("\t").slice(1));
      i++;
      isOver = true;
      continue;
    }

    i++;

  }
  return { result, dbConns };
}

function escapeValue(dbTable: DbTable): DbTable {
  // 找出非空列的 index
  const keepIndexes = dbTable.columns
    .map((c, idx) => ({ c: c, idx }))
    .filter(x => x.c.length > 0)
    .map(x => x.idx);

  // 过滤 columns
  const filteredColumns = keepIndexes.map(i => dbTable.columns[i]);

  // 过滤 rows 中对应列
  const filteredRows = dbTable.data.map(r =>
    keepIndexes.map(i => r[i] ?? '')
  );

  const filteredDbTable: DbTable = {
    table: dbTable.table,
    columns: filteredColumns,
    data: filteredRows
  };
  return filteredDbTable;
}


function dbMapToInsertSql(dbMap: DbMap): Record<string, string> {
  const result: Record<string, string> = {};

  for (const db of Object.keys(dbMap)) {
    const tables = dbMap[db];

    const sqlBlocks: string[] = [];
    const sql = tables
                  .map(item => `truncate table ${item.table};`)
                  .join('\n');
    sqlBlocks.push(sql);

    for (const t of tables) {
      if (!t.data.length) { continue; };

      const cols = t.columns.map(c => `${c}`).join(", ");

      const values = t.data
        .map(row =>
          "(" +
          row
            .map(v => {
              if (/^null$/i.test(v)) {return 'NULL';};
              return `'${v.replace(/'/g, "''")}'`;
            })
            .join(", ") +
          ")"
        )
        .join(",\n");

      sqlBlocks.push(
        `INSERT INTO ${t.table} (${cols}) VALUES\n${values};`
      );
    }

    result[db] = sqlBlocks.join("\n");
  }

  return result;
}
