export function convertExcelToSql(text: string): string {
  return convertCell(text);
}


function convertCell(text: string): string {
  const lines = text.split(/\r?\n/);

  const results: string[] = [];

  let tableName = '';
  let columns: string[] = [];
  let rows: string[][] = [];
  let inData = false;
  let column = false;

  function flush() {
    if (columns.length === 0 || rows.length === 0) {  return; };

    if (!tableName) {
      tableName = 'un_named_table';
    }

    const nullIndexes = columns
      .map((c, i) => /^null$/i.test(c) ? i : -1)
      .filter(i => i !== -1);

    if (nullIndexes.length) {
      columns = columns.filter((_, i) => !nullIndexes.includes(i));
      rows = rows.map(r => r.filter((_, i) => !nullIndexes.includes(i)));
    }

    const values = rows.map(row => {
      const cols = row.map(raw => {
        const v = raw;
        // explicit NULL
        if (/^null$/i.test(v)) {return 'NULL';};

        // empty cell → empty string
        if (v === '') { return "''"; };

        // number
        // 不需要检测数字类型，直接按string处理，因为insert后也是更加table的实际类型去转换的，所以插入string也ok
        // if (!isNaN(Number(v))) {return v;};

        // string
        return `'${v.replace(/'/g, "''")}'`;
      });

      return `(${cols.join(', ')})`;
    });

    results.push(
      `\nINSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values.join(',\n')};\n`
    );
  }

  for (const rawLine of lines) {
    const line = rawLine;

    if (line.startsWith('tableName:')) {
      flush();

      tableName = line.replace('tableName:', '').trim();
      columns = [];
      rows = [];
      inData = false;
      column = false;
      continue;
    }

    if (line.startsWith('data:')) {
      column = true;
      continue;
    }

    if (column && line !== '' && !line.startsWith('\/\/')) {
      columns = line
        .split('\t')
        .map(v => v.trim());
      column = false;
      inData = true;
      continue;
    }

    if (inData && line !== '' && !line.startsWith('\/\/')) {
      rows.push(line.split('\t').map(v => v));
    }
  }

  // last block
  flush();

  return results.join('\n\n');
}