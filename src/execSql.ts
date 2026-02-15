import { Client } from "pg";
import { PgConn } from "./DataType";

export async function executePgSql(
  conn: PgConn,
  sql: string
) {
  const client = new Client(conn);

  await client.connect();

  try {
    await client.query("BEGIN");

    await client.query(sql);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}