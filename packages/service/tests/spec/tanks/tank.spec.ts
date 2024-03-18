import { TankMaterial } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { TankEntity, UserEntity } from '../../../src/data';
import { Tank } from '../../../src/tanks/tank';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils/create-test-user';

const UserId = 'd0a65997-9015-4f1e-bbb2-fa25b45cfc09';
const TestData: Partial<TankEntity> = {
  id: '55912587-8024-4f43-b527-9cb3740ff996',
  name: 'Special Test Tank',
  material: TankMaterial.Aluminum,
  volume: 12.1,
  workingPressure: 233.3,
};

describe('Tank Class', () => {
  let Tanks: Repository<TankEntity>;
  let Users: Repository<UserEntity>;

  let user: UserEntity;
  let tankData: TankEntity;
  let tank: Tank;

  beforeAll(() => {
    Tanks = dataSource.getRepository(TankEntity);
    Users = dataSource.getRepository(UserEntity);
  });

  beforeEach(async () => {
    tankData = new TankEntity();
    Object.assign(tankData, TestData);
    tank = new Tank(Tanks, tankData);

    user = createTestUser({ id: UserId });
    await Users.save(user);
  });

  it('will return properties correctly', () => {
    expect(tank.id).toBe(TestData.id);
    expect(tank.name).toBe(TestData.name);
    expect(tank.material).toBe(TestData.material);
    expect(tank.volume).toBe(TestData.volume);
    expect(tank.workingPressure).toBe(TestData.workingPressure);
    expect(tank.user).toBeNull();
    expect(tank.isSystem).toBe(true);

    tankData.user = user;
    expect(tank.user?.userId).toBe(UserId);
    expect(tank.isSystem).toBe(false);
  });

  it('will create a new system-wide tank profile', async () => {
    await tank.save();

    const result = await Tanks.findOneOrFail({
      relations: ['user'],
      where: { id: TestData.id },
    });
    expect(result.id).toBe(TestData.id);
    expect(result.name).toBe(TestData.name);
    expect(result.material).toBe(TestData.material);
    expect(result.volume).toBe(TestData.volume);
    expect(result.workingPressure).toBe(TestData.workingPressure);
    expect(result.user).toBeNull();
  });

  it('will create a new user-defined tank profile', async () => {
    tankData.user = user;
    await tank.save();

    const result = await Tanks.findOneOrFail({
      relations: ['user'],
      where: { id: TestData.id },
    });
    expect(result.id).toBe(TestData.id);
    expect(result.name).toBe(TestData.name);
    expect(result.material).toBe(TestData.material);
    expect(result.volume).toBe(TestData.volume);
    expect(result.workingPressure).toBe(TestData.workingPressure);
    expect(result.user!.id).toEqual(user.id);
  });

  it('will update a tank profile', async () => {
    await tank.save();

    tank.name = 'Updated Tank';
    tank.material = TankMaterial.Steel;
    tank.volume = 13.22;
    tank.workingPressure = 140.5;
    await tank.save();

    const result = await Tanks.findOneByOrFail({ id: TestData.id });
    expect(result.id).toBe(TestData.id);
    expect(result.name).toBe('Updated Tank');
    expect(result.material).toBe(TankMaterial.Steel);
    expect(result.volume).toBe(13.22);
    expect(result.workingPressure).toBe(140.5);
  });

  it('will delete a tank profile', async () => {
    await Tanks.save(tankData);
    await expect(tank.delete()).resolves.toBe(true);
    const result = await Tanks.findOneBy({ id: TestData.id });
    expect(result).toBeNull();
  });

  it('will return false if the tank profile cannot be deleted', async () => {
    await expect(tank.delete()).resolves.toBe(false);
  });

  it('will return the JSON representation of the tank profile', () => {
    expect(tank.toJSON()).toEqual({
      id: TestData.id,
      name: TestData.name,
      material: TestData.material,
      volume: TestData.volume,
      workingPressure: TestData.workingPressure,
      isSystem: true,
    });
  });
});
