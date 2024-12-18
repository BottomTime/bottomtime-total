import mockFetch from 'fetch-mock-jest';

import {
  ApiList,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseSchema,
  TankDTO,
  TankMaterial,
} from '../../src';
import { Fetcher } from '../../src/client/fetcher';
import { TanksApiClient } from '../../src/client/tanks';
import TestData from '../fixtures/tanks-search-results.json';

const Username = 'testuser';

describe('Tanks API client', () => {
  let fetcher: Fetcher;
  let client: TanksApiClient;
  let tanks: ApiList<TankDTO>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new TanksApiClient(fetcher);
    tanks = ListTanksResponseSchema.parse(TestData);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  describe('for user tanks', () => {
    it('will create a tank', async () => {
      mockFetch.post(`/api/users/${Username}/tanks`, {
        status: 200,
        body: tanks.data[0],
      });
      const options = CreateOrUpdateTankParamsSchema.parse(tanks.data[0]);

      const newTank = await client.createTank(options, Username);

      expect(newTank).toEqual(tanks.data[0]);
      expect(mockFetch.done()).toBe(true);
    });

    it('will retrieve a single tank', async () => {
      mockFetch.get(`/api/users/${Username}/tanks/${tanks.data[1].id}`, {
        status: 200,
        body: tanks.data[1],
      });

      const tank = await client.getTank(tanks.data[1].id, Username);

      expect(tank).toEqual(tanks.data[1]);
      expect(mockFetch.done()).toBe(true);
    });

    it('will list tanks', async () => {
      mockFetch.get(`/api/users/${Username}/tanks?includeSystem=true`, {
        status: 200,
        body: tanks,
      });

      const result = await client.listTanks({
        username: Username,
        includeSystem: true,
      });

      result.data.forEach((tank, index) => {
        expect(tank).toEqual(tanks.data[index]);
      });
      expect(result.totalCount).toBe(tanks.totalCount);
      expect(mockFetch.done()).toBe(true);
    });

    it('will save changes to a tank', async () => {
      const update: TankDTO = {
        ...tanks.data[2],
        material: TankMaterial.Steel,
        name: 'New Name',
        volume: 12.7,
        workingPressure: 87.2,
      };
      mockFetch.put(
        {
          url: `/api/users/${Username}/tanks/${update.id}`,
          body: {
            material: TankMaterial.Steel,
            name: 'New Name',
            volume: 12.7,
            workingPressure: 87.2,
          },
        },
        {
          status: 200,
          body: update,
        },
      );

      await client.updateTank(update, Username);

      expect(mockFetch.done()).toBe(true);
    });

    it('will delete a tank', async () => {
      const id = 'dfed89b9-1117-4816-bdb9-330b101bee80';
      mockFetch.delete(`/api/users/${Username}/tanks/${id}`, 204);
      await client.deleteTank(id, Username);
      expect(mockFetch.done()).toBe(true);
    });
  });

  describe('for system tanks', () => {
    it('will create a tank', async () => {
      const options = CreateOrUpdateTankParamsSchema.parse(tanks.data[3]);
      mockFetch.post(
        {
          url: '/api/admin/tanks',
          body: options,
        },
        {
          status: 201,
          body: tanks.data[3],
        },
      );

      const newTank = await client.createTank(options);

      expect(newTank).toEqual(tanks.data[3]);
      expect(mockFetch.done()).toBe(true);
    });

    it('will retrieve a single tank', async () => {
      mockFetch.get(`/api/admin/tanks/${tanks.data[4].id}`, {
        status: 200,
        body: tanks.data[4],
      });

      const tank = await client.getTank(tanks.data[4].id);

      expect(tank).toEqual(tanks.data[4]);
      expect(mockFetch.done()).toBe(true);
    });

    it('will list tanks', async () => {
      const expected: ApiList<TankDTO> = {
        data: tanks.data.filter((dto) => dto.isSystem),
        totalCount: tanks.totalCount,
      };
      mockFetch.get('/api/admin/tanks', {
        status: 200,
        body: expected,
      });

      const result = await client.listTanks();

      result.data.forEach((tank, index) => {
        expect(tank).toEqual(expected.data[index]);
      });
      expect(result.totalCount).toBe(tanks.totalCount);
      expect(mockFetch.done()).toBe(true);
    });

    it('will save changes to a tank', async () => {
      const update: TankDTO = {
        ...tanks.data[2],
        material: TankMaterial.Steel,
        name: 'New Name',
        volume: 12.7,
        workingPressure: 87.2,
      };
      mockFetch.put(
        {
          url: `/api/admin/tanks/${update.id}`,
          body: {
            material: TankMaterial.Steel,
            name: 'New Name',
            volume: 12.7,
            workingPressure: 87.2,
          },
        },
        {
          status: 200,
          body: update,
        },
      );

      await client.updateTank(update);

      expect(mockFetch.done()).toBe(true);
    });

    it('will delete a tank', async () => {
      const id = 'dfed89b9-1117-4816-bdb9-330b101bee80';
      mockFetch.delete(`/api/admin/tanks/${id}`, 204);
      await client.deleteTank(id);
      expect(mockFetch.done()).toBe(true);
    });
  });
});
