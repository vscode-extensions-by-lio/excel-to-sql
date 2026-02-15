
export interface DbTable {
  table: string;
  columns: string[];
  data: string[][];
}

export type DbMap = Record<string, DbTable[]>;


export interface PgConn {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface ExecDb {
  conn?: PgConn;        // 有 = 自动执行
  tables: DbTable[];
}

export type ExecDbMap = Record<string, ExecDb>;