/* eslint-disable no-process-env */
import { Config } from '../../src/config';

describe('Config class', () => {
  let oldConfig: object;

  beforeAll(() => {
    oldConfig = Object.assign({}, process.env);
  });

  afterAll(() => {
    Object.assign(process.env, oldConfig);
  });

  it('will return configuration correctly', () => {
    process.env.BT_POSTGRES_URI = 'postgres://user:password@localhost:5432/db';
    process.env.BT_POSTGRES_REQUIRE_SSL = 'true';
    process.env.BT_SQS_QUEUE_URL =
      'http://localstack:4566/000000000000/mah_queue';
    process.env.BT_LOG_LEVEL = 'debug';

    expect(Config.postgresUri).toBe(
      'postgres://user:password@localhost:5432/db',
    );
    expect(Config.postgresRequireSsl).toBe(true);
    expect(Config.sqsQueueUrl).toBe(
      'http://localstack:4566/000000000000/mah_queue',
    );
    expect(Config.logLevel).toBe('debug');
  });

  it('will return default values where appropriate', () => {
    delete process.env.BT_POSTGRES_URI;
    delete process.env.BT_POSTGRES_REQUIRE_SSL;
    delete process.env.BT_SQS_QUEUE_URL;
    delete process.env.BT_LOG_LEVEL;

    expect(Config.postgresUri).toBe(
      'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local',
    );
    expect(Config.postgresRequireSsl).toBe(false);
    expect(Config.sqsQueueUrl).toBe(
      'http://localstack:4566/000000000000/reviews',
    );
    expect(Config.logLevel).toBe('info');
  });
});
