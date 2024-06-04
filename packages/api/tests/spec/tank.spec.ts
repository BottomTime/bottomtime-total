import axios, { AxiosInstance } from 'axios';

import { CreateOrUpdateTankParamsDTO, TankDTO, TankMaterial } from '../../src';
import { Tank } from '../../src/client/tank';

const Username = 'testuser';
const TestData: TankDTO = {
  id: 'd1bb5518-e571-4f4d-8aca-e521fd6dca9f',
  name: 'AL80: Aluminum S80',
  material: TankMaterial.Aluminum,
  workingPressure: 207,
  volume: 11.1,
  isSystem: false,
};

describe('Tank class', () => {
  let axiosClient: AxiosInstance;
  let tank: Tank;

  beforeAll(() => {
    axiosClient = axios.create();
  });

  beforeEach(() => {
    tank = new Tank(axiosClient, TestData, Username);
  });

  it('will return properties correctly', () => {
    expect(tank.id).toBe(TestData.id);
    expect(tank.name).toBe(TestData.name);
    expect(tank.material).toBe(TestData.material);
    expect(tank.volume).toBe(TestData.volume);
    expect(tank.workingPressure).toBe(TestData.workingPressure);
    expect(tank.owner).toBe(Username);
  });

  it('will allow properties to be updated', () => {
    const newName = 'HP100: Steel X7-100 HDG';
    const newMaterial = TankMaterial.Steel;
    const newVolume = 12.9;
    const newWorkingPressure = 237;

    tank.name = newName;
    tank.material = newMaterial;
    tank.volume = newVolume;
    tank.workingPressure = newWorkingPressure;

    expect(tank.name).toBe(newName);
    expect(tank.material).toBe(newMaterial);
    expect(tank.volume).toBe(newVolume);
    expect(tank.workingPressure).toBe(newWorkingPressure);
  });

  it('will render as JSON', () => {
    expect(tank.toJSON()).toEqual(TestData);
  });

  it('will save changes to a system tank', async () => {
    tank = new Tank(axiosClient, { ...TestData, isSystem: true });
    const options: CreateOrUpdateTankParamsDTO = {
      name: 'HP100: Steel X7-100 HDG',
      material: TankMaterial.Steel,
      volume: 12.9,
      workingPressure: 237,
    };
    const spy = jest
      .spyOn(axiosClient, 'put')
      .mockResolvedValue({ data: { ...TestData, ...options, isSystem: true } });

    tank.name = options.name;
    tank.material = options.material;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;

    await tank.update();

    expect(spy).toHaveBeenCalledWith(`/api/admin/tanks/${tank.id}`, options);
  });

  it('will delete a system tank', async () => {
    tank = new Tank(axiosClient, { ...TestData, isSystem: true });
    const spy = jest.spyOn(axiosClient, 'delete').mockResolvedValue({});
    await tank.delete();
    expect(spy).toHaveBeenCalledWith(`/api/admin/tanks/${tank.id}`);
  });

  it('will save changes to a user tank', async () => {
    const options: CreateOrUpdateTankParamsDTO = {
      name: 'HP100: Steel X7-100 HDG',
      material: TankMaterial.Steel,
      volume: 12.9,
      workingPressure: 237,
    };
    const spy = jest
      .spyOn(axiosClient, 'put')
      .mockResolvedValue({ data: { ...TestData, ...options } });

    tank.name = options.name;
    tank.material = options.material;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;

    await tank.update();

    expect(spy).toHaveBeenCalledWith(
      `/api/users/${Username}/tanks/${tank.id}`,
      options,
    );
  });

  it('will delete a user tank', async () => {
    const spy = jest.spyOn(axiosClient, 'delete').mockResolvedValue({});
    await tank.delete();
    expect(spy).toHaveBeenCalledWith(`/api/users/${Username}/tanks/${tank.id}`);
  });
});
