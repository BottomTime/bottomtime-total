import mockFetch from 'fetch-mock-jest';

import { CreateOrUpdateTankParamsDTO, TankDTO, TankMaterial } from '../../src';
import { Fetcher } from '../../src/client/fetcher';
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
  let fetcher: Fetcher;
  let tank: Tank;

  beforeAll(() => {
    fetcher = new Fetcher();
  });

  beforeEach(() => {
    tank = new Tank(fetcher, TestData, Username);
  });

  afterEach(() => {
    mockFetch.restore();
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
    tank = new Tank(fetcher, { ...TestData, isSystem: true });
    const options: CreateOrUpdateTankParamsDTO = {
      name: 'HP100: Steel X7-100 HDG',
      material: TankMaterial.Steel,
      volume: 12.9,
      workingPressure: 237,
    };
    mockFetch.put(
      {
        url: `/api/admin/tanks/${tank.id}`,
        body: options,
      },
      {
        status: 200,
        body: { ...TestData, ...options, isSystem: true },
      },
    );

    tank.name = options.name;
    tank.material = options.material;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;

    await tank.save();

    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a system tank', async () => {
    tank = new Tank(fetcher, { ...TestData, isSystem: true });
    mockFetch.delete(`/api/admin/tanks/${tank.id}`, 204);
    await tank.delete();
    expect(mockFetch.done()).toBe(true);
  });

  it('will save changes to a user tank', async () => {
    const options: CreateOrUpdateTankParamsDTO = {
      name: 'HP100: Steel X7-100 HDG',
      material: TankMaterial.Steel,
      volume: 12.9,
      workingPressure: 237,
    };
    mockFetch.put(
      {
        url: `/api/users/${Username}/tanks/${tank.id}`,
        body: options,
      },
      {
        status: 200,
        body: { ...TestData, ...options },
      },
    );

    tank.name = options.name;
    tank.material = options.material;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;

    await tank.save();

    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a user tank', async () => {
    mockFetch.delete(`/api/users/${Username}/tanks/${tank.id}`, 204);
    await tank.delete();
    expect(mockFetch.done());
  });
});
