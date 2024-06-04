import axios, { AxiosInstance } from 'axios';

import {
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
} from '../../src';
import { TanksApiClient } from '../../src/client/tanks';
import TestData from '../fixtures/tanks-search-results.json';

const Username = 'testuser';

describe('Tanks API client', () => {
  let axiosClient: AxiosInstance;
  let client: TanksApiClient;
  let tanks: ListTanksResponseDTO;

  beforeAll(() => {
    axiosClient = axios.create();
    client = new TanksApiClient(axiosClient);
    tanks = ListTanksResponseSchema.parse(TestData);
  });

  describe('for user tanks', () => {
    it('will create a tank', async () => {
      const spy = jest
        .spyOn(axiosClient, 'post')
        .mockResolvedValue({ data: tanks.tanks[0] });
      const options = CreateOrUpdateTankParamsSchema.parse(tanks.tanks[0]);

      const newTank = await client.createTank(options, Username);

      expect(newTank.toJSON()).toEqual(tanks.tanks[0]);
      expect(newTank.owner).toBe(Username);
      expect(spy).toHaveBeenCalledWith(`/api/users/${Username}/tanks`, options);
    });

    it('will retrieve a single tank', async () => {
      const spy = jest
        .spyOn(axiosClient, 'get')
        .mockResolvedValue({ data: tanks.tanks[1] });

      const tank = await client.getTank(tanks.tanks[1].id, Username);

      expect(tank.toJSON()).toEqual(tanks.tanks[1]);
      expect(tank.owner).toBe(Username);
      expect(spy).toHaveBeenCalledWith(
        `/api/users/${Username}/tanks/${tanks.tanks[1].id}`,
      );
    });

    it('will list tanks', async () => {
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: tanks,
      });

      const result = await client.listTanks({
        username: Username,
        includeSystem: true,
      });

      result.tanks.forEach((tank, index) => {
        const json = tank.toJSON();
        expect(json).toEqual(tanks.tanks[index]);
        expect(tank.owner).toBe(json.isSystem ? undefined : Username);
      });
      expect(result.totalCount).toBe(tanks.totalCount);
      expect(spy).toHaveBeenCalledWith(`/api/users/${Username}/tanks`, {
        params: { includeSystem: true },
      });
    });
  });

  describe('for system tanks', () => {
    it('will create a tank', async () => {
      const spy = jest
        .spyOn(axiosClient, 'post')
        .mockResolvedValue({ data: tanks.tanks[3] });
      const options = CreateOrUpdateTankParamsSchema.parse(tanks.tanks[3]);

      const newTank = await client.createTank(options);

      expect(newTank.toJSON()).toEqual(tanks.tanks[3]);
      expect(newTank.owner).toBeUndefined();
      expect(spy).toHaveBeenCalledWith('/api/admin/tanks', options);
    });

    it('will retrieve a single tank', async () => {
      const spy = jest
        .spyOn(axiosClient, 'get')
        .mockResolvedValue({ data: tanks.tanks[4] });

      const tank = await client.getTank(tanks.tanks[4].id);

      expect(tank.toJSON()).toEqual(tanks.tanks[4]);
      expect(tank.owner).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(`/api/admin/tanks/${tanks.tanks[4].id}`);
    });

    it('will list tanks', async () => {
      const expected: ListTanksResponseDTO = {
        tanks: tanks.tanks.filter((dto) => dto.isSystem),
        totalCount: tanks.totalCount,
      };
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: expected,
      });

      const result = await client.listTanks();

      result.tanks.forEach((tank, index) => {
        expect(tank.toJSON()).toEqual(expected.tanks[index]);
        expect(tank.owner).toBeUndefined();
      });
      expect(result.totalCount).toBe(tanks.totalCount);
      expect(spy).toHaveBeenCalledWith('/api/admin/tanks', {});
    });
  });
});
