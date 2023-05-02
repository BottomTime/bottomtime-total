import config from '@/config';

describe('Config class', () => {
  let oldEnv: object;

  beforeEach(() => {
    oldEnv = Object.assign({}, process.env);
  });

  afterEach(() => {
    Object.assign(process.env, oldEnv);
  });

  it('Will return properties correctly', () => {
    const adminEmail = 'bossman@email.org';
    const baseUrl = 'https://site.com/';
    const env = 'test';

    process.env.VUE_APP_BT_ADMIN_EMAIL = adminEmail;
    process.env.BASE_URL = baseUrl;
    process.env.NODE_ENV = env;

    expect(config.adminEmail).toEqual(adminEmail);
    expect(config.baseUrl).toEqual(baseUrl);
    expect(config.env).toEqual(env);
  });

  it('Will return defaults if environment variables are not set', () => {
    delete process.env.VUE_APP_BT_ADMIN_EMAIL;
    delete process.env.BASE_URL;
    delete process.env.NODE_ENV;

    expect(config.adminEmail).toEqual('admin@bottomti.me');
    expect(config.baseUrl).toEqual('http://localhost:8080/');
    expect(config.env).toEqual('local');
  });
});
