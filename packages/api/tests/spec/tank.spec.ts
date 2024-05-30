import axios, { AxiosInstance } from 'axios';

import { TankDTO, TankMaterial } from '../../src';
import { Tank } from '../../src/client/tank';

const Username = 'Diver_McDiverson';
const TestData: TankDTO = {
  id: 'bd7588d8-d8ce-434b-ba3b-154fab03188c',
  isSystem: true,
  material: TankMaterial.Steel,
  name: 'HP100',
  workingPressure: 232,
  volume: 12.2,
};

describe('Tank class', () => {
  let client: AxiosInstance;

  beforeAll(() => {
    client = axios.create();
  });

  it('will return properties correctly', () => {
    const tank = new Tank(client, () => Username, TestData);
    expect(tank.id).toBe(TestData.id);
    expect(tank.isSystem).toBe(TestData.isSystem);
    expect(tank.material).toBe(TestData.material);
    expect(tank.name).toBe(TestData.name);
    expect(tank.workingPressure).toBe(TestData.workingPressure);
    expect(tank.volume).toBe(TestData.volume);
  });

  it('will allow properties to be updated', () => {
    const tank = new Tank(client, () => Username, TestData);
    tank.name = 'LP85';
    tank.material = TankMaterial.Aluminum;
    tank.workingPressure = 189;
    tank.volume = 8.5;

    expect(tank.name).toBe('LP85');
    expect(tank.material).toBe(TankMaterial.Aluminum);
    expect(tank.workingPressure).toBe(189);
    expect(tank.volume).toBe(8.5);
  });

  it('will render as JSON', () => {
    const tank = new Tank(client, () => Username, TestData);
    expect(tank.toJSON()).toEqual(TestData);
  });

  describe('for admins', () => {
    it('will save changes to a tank', async () => {
      const spy = jest.spyOn(client, 'put').mockResolvedValue({
        data: {
          ...TestData,
          name: 'LP85',
          material: TankMaterial.Aluminum,
          workingPressure: 189,
          volume: 8.5,
        },
      });
      const tank = new Tank(client, () => undefined, TestData);

      tank.name = 'LP85';
      tank.material = TankMaterial.Aluminum;
      tank.workingPressure = 189;
      tank.volume = 8.5;

      await tank.save();

      expect(spy).toHaveBeenCalledWith(`/api/admin/tanks/${TestData.id}`, {
        ...TestData,
        name: 'LP85',
        material: TankMaterial.Aluminum,
        workingPressure: 189,
        volume: 8.5,
      });
    });

    it('will delete a tank', async () => {
      const spy = jest.spyOn(client, 'delete').mockResolvedValue({});
      const tank = new Tank(client, () => undefined, TestData);

      await tank.delete();

      expect(spy).toHaveBeenCalledWith(`/api/admin/tanks/${TestData.id}`);
    });
  });

  describe('for users', () => {
    it('will save changes to a tank', async () => {
      const spy = jest.spyOn(client, 'put').mockResolvedValue({
        data: {
          ...TestData,
          name: 'LP85',
          material: TankMaterial.Aluminum,
          workingPressure: 189,
          volume: 8.5,
        },
      });
      const tank = new Tank(client, () => Username, TestData);

      tank.name = 'LP85';
      tank.material = TankMaterial.Aluminum;
      tank.workingPressure = 189;
      tank.volume = 8.5;

      await tank.save();

      expect(spy).toHaveBeenCalledWith(
        `/api/users/${Username}/tanks/${TestData.id}`,
        {
          ...TestData,
          name: 'LP85',
          material: TankMaterial.Aluminum,
          workingPressure: 189,
          volume: 8.5,
        },
      );
    });

    it('will delete a tank', async () => {
      const spy = jest.spyOn(client, 'delete').mockResolvedValue({});
      const tank = new Tank(client, () => Username, TestData);

      await tank.delete();

      expect(spy).toHaveBeenCalledWith(
        `/api/users/${Username}/tanks/${TestData.id}`,
      );
    });
  });
});
