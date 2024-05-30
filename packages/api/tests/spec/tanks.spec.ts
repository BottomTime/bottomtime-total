import axios, { AxiosInstance } from 'axios';

import { CreateOrUpdateTankParamsDTO, TankDTO, TankMaterial } from '../../src';
import { TanksApiClient } from '../../src//client/tanks';

const Username = 'CharlotteDives37';
const TestData: TankDTO[] = [
  {
    id: 'bd7588d8-d8ce-434b-ba3b-154fab03188c',
    isSystem: true,
    material: TankMaterial.Steel,
    name: 'HP100',
    workingPressure: 232,
    volume: 12.2,
  },
  {
    id: 'd1bb5518-e571-4f4d-8aca-e521fd6dca9f',
    isSystem: true,
    name: 'AL80: Aluminum S80',
    material: TankMaterial.Aluminum,
    workingPressure: 207,
    volume: 11.1,
  },
];

describe('Tanks API client', () => {
  let axiosClient: AxiosInstance;

  beforeAll(() => {
    axiosClient = axios.create();
  });

  describe('for users', () => {
    let client: TanksApiClient;

    beforeAll(() => {
      client = new TanksApiClient(axiosClient, () => Username);
    });

    it('will return a single tank', async () => {
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: TestData[0],
      });

      const result = await client.getTank(TestData[0].id);

      expect(spy).toHaveBeenCalledWith(
        `/api/users/${Username}/tanks/${TestData[0].id}`,
      );
      expect(result.toJSON()).toEqual(TestData[0]);
    });

    it('will create a new tank', async () => {
      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Aluminum,
        name: 'LP85',
        volume: 8.5,
        workingPressure: 189,
      };
      const response: TankDTO = {
        ...options,
        id: '592bcf2b-17da-4422-8e4a-a29a6bae305b',
        isSystem: false,
      };
      const spy = jest.spyOn(axiosClient, 'post').mockResolvedValue({
        data: response,
      });

      const result = await client.createTank(options);

      expect(spy).toHaveBeenCalledWith(`/api/users/${Username}/tanks`, options);
      expect(result.toJSON()).toEqual(response);
    });

    it('will list tanks', async () => {
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: {
          tanks: TestData,
          totalCount: TestData.length,
        },
      });

      const result = await client.listTanks();

      expect(spy).toHaveBeenCalledWith(`/api/users/${Username}/tanks`, {
        params: { includeSystem: true },
      });
      expect(result.tanks.map((tank) => tank.toJSON())).toEqual(TestData);
      expect(result.totalCount).toBe(TestData.length);
    });

    it("will list only the user's tanks", async () => {
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: {
          tanks: [TestData[0]],
          totalCount: 1,
        },
      });

      const result = await client.listTanks(false);

      expect(spy).toHaveBeenCalledWith(`/api/users/${Username}/tanks`, {
        params: { includeSystem: false },
      });
      expect(result.tanks.map((tank) => tank.toJSON())).toEqual([TestData[0]]);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('for admins', () => {
    let client: TanksApiClient;

    beforeAll(() => {
      client = new TanksApiClient(axiosClient, () => undefined);
    });

    it('will return a single tank', async () => {
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: TestData[1],
      });

      const result = await client.getTank(TestData[1].id);

      expect(spy).toHaveBeenCalledWith(`/api/admin/tanks/${TestData[1].id}`);
      expect(result.toJSON()).toEqual(TestData[1]);
    });

    it('will create a new tank', async () => {
      const options: CreateOrUpdateTankParamsDTO = {
        material: TankMaterial.Aluminum,
        name: 'LP85',
        volume: 8.5,
        workingPressure: 189,
      };
      const response: TankDTO = {
        ...options,
        id: '592bcf2b-17da-4422-8e4a-a29a6bae305b',
        isSystem: false,
      };
      const spy = jest.spyOn(axiosClient, 'post').mockResolvedValue({
        data: response,
      });

      const result = await client.createTank(options);

      expect(spy).toHaveBeenCalledWith(`/api/admin/tanks`, options);
      expect(result.toJSON()).toEqual(response);
    });

    it('will list tanks', async () => {
      const spy = jest.spyOn(axiosClient, 'get').mockResolvedValue({
        data: {
          tanks: TestData,
          totalCount: TestData.length,
        },
      });

      const result = await client.listTanks();

      expect(spy).toHaveBeenCalledWith(`/api/admin/tanks`, {
        params: { includeSystem: undefined },
      });
      expect(result.tanks.map((tank) => tank.toJSON())).toEqual(TestData);
      expect(result.totalCount).toBe(TestData.length);
    });
  });
});
