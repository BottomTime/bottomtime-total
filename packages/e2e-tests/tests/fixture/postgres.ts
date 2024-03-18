import { Client } from 'pg';

export const PostgresUri =
  process.env.BT_POSTGRES_TEST_URI ||
  'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_e2e';

export async function getClient(): Promise<Client> {
  const client = new Client({
    connectionString: PostgresUri,
  });
  await client.connect();
  return client;
}

export async function purgeDatabase(client: Client): Promise<void> {
  const ProtectedTables = new Set([
    'geometry_columns',
    'geography_columns',
    'spatial_ref_sys',
    'migrations',
    'typeorm_metadata',
  ]);

  const tables = await client.query<{ table: string }>(
    `SELECT table_name AS table FROM information_schema.tables WHERE table_schema = 'public'`,
  );

  await Promise.all(
    tables.rows
      .filter(({ table }) => !ProtectedTables.has(table))
      .map(({ table }) => client.query(`DELETE FROM ${table}`)),
  );
}
