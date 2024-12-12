import { HttpService } from '@nestjs/axios';

import { AxiosResponse } from 'axios';
import { It, Mock, Times } from 'moq.ts';
import { createMocks } from 'node-mocks-http';
import { RedisClientType } from 'redis';
import { EMPTY, of } from 'rxjs';

import { Config } from '../../src/config';
import { GeolocationMiddleware } from '../../src/geolocation.middleware';
import { GeolocationData } from '../../src/types/geolocation';

jest.mock('../../src/config');

const ApiKey = 'abcd1234';
const IpAddress = '121.11.84.133';
const TestData: GeolocationData = {
  ip: '99.230.201.42',
  continent_code: 'NA',
  continent_name: 'North America',
  country_code2: 'CA',
  country_code3: 'CAN',
  country_name: 'Canada',
  country_name_official: 'Canada',
  country_capital: 'Ottawa',
  state_prov: 'Ontario',
  state_code: 'CA-ON',
  district: 'Toronto Division',
  city: 'Toronto',
  zipcode: 'M5H',
  latitude: '43.65323',
  longitude: '-79.38318',
  is_eu: false,
  calling_code: '+1',
  country_tld: '.ca',
  languages: 'en-CA,fr-CA,iu',
  country_flag: 'https://ipgeolocation.io/static/flags/ca_64.png',
  geoname_id: '8014951',
  isp: 'Rogers Cable Inc. WLFDLE',
  connection_type: '',
  organization: 'Rogers Communications Canada Inc.',
  country_emoji: '🇨🇦',
  currency: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
  },
  time_zone: {
    name: 'America/Toronto',
    offset: -5,
    offset_with_dst: -5,
    current_time: '2024-12-12 14:11:49.984-0500',
    current_time_unix: 1734030709.984,
    is_dst: false,
    dst_savings: 0,
    dst_exists: true,
    dst_start: {
      utc_time: '2024-03-10 TIME 07',
      duration: '+1H',
      gap: true,
      dateTimeAfter: '2024-03-10 TIME 03',
      dateTimeBefore: '2024-03-10 TIME 02',
      overlap: false,
    },
    dst_end: {
      utc_time: '2024-11-03 TIME 06',
      duration: '-1H',
      gap: false,
      dateTimeAfter: '2024-11-03 TIME 01',
      dateTimeBefore: '2024-11-03 TIME 02',
      overlap: true,
    },
  },
};

describe('Geolocation middlware', () => {
  let http: Mock<HttpService>;
  let redis: Mock<RedisClientType>;
  let middleware: GeolocationMiddleware;

  beforeEach(() => {
    http = new Mock<HttpService>();
    redis = new Mock<RedisClientType>();
    middleware = new GeolocationMiddleware(http.object(), redis.object());

    jest.mocked(Config).ipGeolocationApiKey = ApiKey;
  });

  it('will skip lookup if the API key is not set', async () => {
    jest.mocked(Config).ipGeolocationApiKey = undefined;
    redis.setup((x) => x.get(It.IsAny())).returnsAsync(null);
    http.setup((x) => x.get(It.IsAny(), It.IsAny())).returns(EMPTY);
    const { req, res } = createMocks({ ip: IpAddress });
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.geolocation).toBeUndefined();
    expect(next).toHaveBeenCalled();
    redis.verify((x) => x.get(It.IsAny()), Times.Never());
    http.verify((x) => x.get(It.IsAny(), It.IsAny()), Times.Never());
  });

  it('will skip lookup if the request has no IP to lookup', async () => {
    const { req, res } = createMocks({ ip: undefined });
    redis.setup((x) => x.get(It.IsAny())).returnsAsync(null);
    http.setup((x) => x.get(It.IsAny(), It.IsAny())).returns(EMPTY);
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.geolocation).toBeUndefined();
    expect(next).toHaveBeenCalled();
    redis.verify((x) => x.get(It.IsAny()), Times.Never());
    http.verify((x) => x.get(It.IsAny(), It.IsAny()), Times.Never());
  });

  it('will retrieve data from Redis if available', async () => {
    const { req, res } = createMocks({ ip: IpAddress });
    redis
      .setup((x) => x.get(It.IsAny()))
      .returnsAsync(JSON.stringify(TestData));
    http.setup((x) => x.get(It.IsAny(), It.IsAny())).returns(EMPTY);
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.geolocation).toEqual(TestData);
    expect(next).toHaveBeenCalled();
    redis.verify((x) => x.get(`geolocation:${IpAddress}`), Times.Once());
    http.verify((x) => x.get(It.IsAny(), It.IsAny()), Times.Never());
  });

  it('will perform an IP geolocation lookup if there is no cache hit', async () => {
    const { req, res } = createMocks({ ip: IpAddress });
    redis.setup((x) => x.get(It.IsAny())).returnsAsync(null);
    redis
      .setup((x) => x.set(It.IsAny(), It.IsAny(), It.IsAny()))
      .returnsAsync('');
    http
      .setup((x) => x.get(It.IsAny(), It.IsAny()))
      .returns(of({ data: TestData } as AxiosResponse<GeolocationData>));
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.geolocation).toEqual(TestData);
    expect(next).toHaveBeenCalled();
    redis.verify((x) => x.get(`geolocation:${IpAddress}`), Times.Once());
    http.verify(
      (x) => x.get('https://api.ipgeolocation.io/ipgeo', It.IsAny()),
      Times.Once(),
    );

    // Value should also be cached!
    redis.verify(
      (x) =>
        x.set(`geolocation:${IpAddress}`, JSON.stringify(TestData), It.IsAny()),
      Times.Once(),
    );
  });

  it('will fail gracefully if an error occurs during the lookup', async () => {
    const { req, res } = createMocks({ ip: IpAddress });
    redis.setup((x) => x.get(It.IsAny())).throwsAsync(new Error('Nope'));
    redis
      .setup((x) => x.set(It.IsAny(), It.IsAny(), It.IsAny()))
      .returnsAsync('');
    http.setup((x) => x.get(It.IsAny(), It.IsAny())).returns(EMPTY);
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.geolocation).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
