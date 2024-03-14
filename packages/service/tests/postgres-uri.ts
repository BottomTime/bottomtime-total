export const PostgresUri =
  process.env.BT_POSTGRES_TEST_URI ||
  'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_test';
