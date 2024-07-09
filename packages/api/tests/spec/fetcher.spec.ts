import fetchMock from 'fetch-mock-jest';
import qs from 'qs';

import { HttpException } from '../../src/client/errors';
import { Fetcher } from '../../src/client/fetcher';
import { ErrorResponseDTO } from '../../src/types';

describe('Fetcher class', () => {
  let fetcher: Fetcher;

  beforeAll(() => {
    fetcher = new Fetcher();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  describe('when performing get requests', () => {
    const data = { sweet: true, awesomeness: 100 };

    it('will perform a basic get request', async () => {
      const url = '/api/users/guy';
      fetchMock.get(url, { status: 200, body: data });

      const response = await fetcher.get(url);

      expect(response.data).toEqual(data);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform a get request with query string parameters', async () => {
      const url = '/api/users/guy';
      const query = {
        name: 'Guy',
        age: false,
        count: 15,
        before: new Date('2021-01-01T00:00:00Z'),
      };
      fetchMock.get(
        `${url}?${qs.stringify({
          ...query,
          before: query.before.toISOString(),
        })}`,
        { status: 200, body: data },
      );

      const response = await fetcher.get(url, query);

      expect(response.data).toEqual(data);
      expect(fetchMock.done()).toBe(true);
    });

    it('will throw an HttpException if the response status is not 2xx', async () => {
      const url = '/api/users/guy';
      const error: ErrorResponseDTO = {
        method: 'GET',
        path: url,
        status: 404,
        message: 'Not Found',
      };
      fetchMock.get(url, { status: 404, body: error });
      await expect(fetcher.get(url)).rejects.toThrow(HttpException);
      expect(fetchMock.done()).toBe(true);
    });
  });

  describe('when performing head requests', () => {
    [200, 401, 404].forEach((status) => {
      it(`will return status code ${status}`, async () => {
        const url = '/api/users/guy';
        fetchMock.head(url, status);
        await expect(fetcher.head(url)).resolves.toBe(status);
        expect(fetchMock.done()).toBe(true);
      });
    });
  });

  describe('when performing delete requests', () => {
    it('will make a delete request', async () => {
      const url = '/api/users/guy';
      fetchMock.delete(url, { status: 204 });

      const response = await fetcher.delete(url);

      expect(response.status).toBe(204);
      expect(fetchMock.done()).toBe(true);
    });

    it('will throw an HttpException if the response status is not 2xx', async () => {
      const url = '/api/users/guy';
      const error: ErrorResponseDTO = {
        method: 'DELETE',
        path: url,
        status: 403,
        message: 'Forbidden',
      };

      fetchMock.delete(url, { status: 403, body: error });
      await expect(fetcher.delete(url)).rejects.toThrow(HttpException);
      expect(fetchMock.done()).toBe(true);
    });
  });

  describe('when performing post requests', () => {
    const data = { name: 'Guy', birthdate: new Date('2021-01-01'), rank: 20 };
    const res = { sweet: true, awesomeness: 100 };

    it('will make a post request', async () => {
      const url = '/api/users/guy';
      fetchMock.post(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        { status: 201, body: res },
      );

      const response = await fetcher.post(url, data);

      expect(response.data).toEqual(res);
      expect(fetchMock.done()).toBe(true);
    });

    it('will throw an HttpException if the response status is not 2xx', async () => {
      const url = '/api/users/guy';
      const error: ErrorResponseDTO = {
        method: 'POST',
        path: url,
        status: 409,
        message: 'Conflict',
      };
      fetchMock.post(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        { status: 409, body: error },
      );

      await expect(fetcher.post(url, data)).rejects.toThrow(HttpException);
    });
  });

  describe('when performing put requests', () => {
    const data = { name: 'Guy', birthdate: new Date('2021-01-01'), rank: 20 };
    const res = { sweet: true, awesomeness: 100 };

    it('will make a post request', async () => {
      const url = '/api/users/guy';
      fetchMock.post(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        { status: 201, body: res },
      );

      const response = await fetcher.post(url, data);

      expect(response.data).toEqual(res);
      expect(fetchMock.done()).toBe(true);
    });

    it('will throw an HttpException if the response status is not 2xx', async () => {
      const url = '/api/users/guy';
      const error: ErrorResponseDTO = {
        method: 'POST',
        path: url,
        status: 409,
        message: 'Conflict',
      };
      fetchMock.post(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        { status: 409, body: error },
      );

      await expect(fetcher.post(url, data)).rejects.toThrow(HttpException);
    });

    it('will perform a post request where the response body is empty', async () => {
      const url = '/api/users/guy';
      fetchMock.post(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        204,
      );

      await expect(fetcher.post(url, data)).resolves.toEqual({
        data: {},
        status: 204,
        statusText: 'No Content',
      });
    });

    it('will perform a patch request where the response body is empty', async () => {
      const url = '/api/users/guy';
      fetchMock.patch(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        204,
      );

      await expect(fetcher.patch(url, data)).resolves.toEqual({
        data: {},
        status: 204,
        statusText: 'No Content',
      });
    });
  });

  describe('when performing patch requests', () => {
    const data = { name: 'Guy', birthdate: new Date('2021-01-01'), rank: 20 };
    const res = { sweet: true, awesomeness: 100 };

    it('will make a patch request', async () => {
      const url = '/api/users/guy';
      fetchMock.patch(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        { status: 200, body: res },
      );

      const response = await fetcher.patch(url, data);

      expect(response.data).toEqual(res);
      expect(fetchMock.done()).toBe(true);
    });

    it('will throw an HttpException if the response status is not 2xx', async () => {
      const url = '/api/users/guy';
      const error: ErrorResponseDTO = {
        method: 'POST',
        path: url,
        status: 409,
        message: 'Conflict',
      };
      fetchMock.post(
        {
          url,
          body: {
            ...data,
            birthdate: data.birthdate.toISOString(),
          },
        },
        { status: 409, body: error },
      );

      await expect(fetcher.post(url, data)).rejects.toThrow(HttpException);
    });
  });

  describe('with base URL', () => {
    const baseURL = 'https://api.example.com';
    let fetcher: Fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({ baseURL });
    });

    it('will perform get request', async () => {
      const url = '/api/users/guy';
      fetchMock.get(`${baseURL}${url}`, { status: 200, body: {} });
      await fetcher.get(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform post request', async () => {
      const url = '/api/users/guy';
      fetchMock.post(`${baseURL}${url}`, { status: 201, body: {} });
      await fetcher.post(url, {});
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform put request', async () => {
      const url = '/api/users/guy';
      fetchMock.put(`${baseURL}${url}`, { status: 200, body: {} });
      await fetcher.put(url, {});
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform delete request', async () => {
      const url = '/api/users/guy';
      fetchMock.delete(`${baseURL}${url}`, { status: 204 });
      await fetcher.delete(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform head request', async () => {
      const url = '/api/users/guy';
      fetchMock.head(`${baseURL}${url}`, 200);
      await fetcher.head(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform patch request', async () => {
      const url = '/api/users/guy';
      fetchMock.patch(`${baseURL}${url}`, { status: 200, body: {} });
      await fetcher.patch(url, {});
      expect(fetchMock.done()).toBe(true);
    });
  });

  describe('with bearer token', () => {
    const url = '/api/users/guy';
    let fetcher: Fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({ authToken: 'abcd1234' });
    });

    it('will perform get request', async () => {
      fetchMock.get(
        { url, headers: { Authorization: 'Bearer abcd1234' } },
        { status: 200, body: {} },
      );
      await fetcher.get(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform post request', async () => {
      fetchMock.post(
        { url, headers: { Authorization: 'Bearer abcd1234' } },
        { status: 200, body: {} },
      );
      await fetcher.post(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform put request', async () => {
      fetchMock.put(
        { url, headers: { Authorization: 'Bearer abcd1234' } },
        { status: 200, body: {} },
      );
      await fetcher.put(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform delete request', async () => {
      fetchMock.delete(
        { url, headers: { Authorization: 'Bearer abcd1234' } },
        { status: 200, body: {} },
      );
      await fetcher.delete(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform head request', async () => {
      fetchMock.head(
        { url, headers: { Authorization: 'Bearer abcd1234' } },
        200,
      );
      await fetcher.head(url);
      expect(fetchMock.done()).toBe(true);
    });

    it('will perform patch request', async () => {
      fetchMock.patch(
        { url, headers: { Authorization: 'Bearer abcd1234' } },
        { status: 200, body: {} },
      );
      await fetcher.patch(url);
      expect(fetchMock.done()).toBe(true);
    });
  });
});
