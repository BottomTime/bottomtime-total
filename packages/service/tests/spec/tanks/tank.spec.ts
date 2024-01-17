import { TankMaterial } from '@bottomtime/api';
import { TankData, TankDocument, TankModel } from '../../../src/schemas';
import { Tank } from '../../../src/tanks/tank';

const UserId = 'D0A65997-9015-4F1E-BBB2-FA25B45CFC09';
const TestData: TankData = {
  _id: '55912587-8024-4F43-B527-9CB3740FF996',
  name: 'Special Test Tank',
  material: TankMaterial.Aluminum,
  volume: 12.1,
  workingPressure: 233.3,
};

describe('Tank Class', () => {
  let tankDocument: TankDocument;
  let tank: Tank;

  beforeEach(() => {
    tankDocument = new TankModel(TestData);
    tank = new Tank(tankDocument);
  });

  it('will return properties correctly', () => {
    expect(tank.id).toBe(TestData._id);
    expect(tank.name).toBe(TestData.name);
    expect(tank.material).toBe(TestData.material);
    expect(tank.volume).toBe(TestData.volume);
    expect(tank.workingPressure).toBe(TestData.workingPressure);
    expect(tank.userId).toBeUndefined();
    expect(tank.isSystem).toBe(true);

    tankDocument.user = UserId;
    expect(tank.userId).toBe(UserId);
    expect(tank.isSystem).toBe(false);
  });

  it('will create a new system-wide tank profile', async () => {
    await tank.save();

    const result = await TankModel.findById(TestData._id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(TestData._id);
    expect(result!.name).toBe(TestData.name);
    expect(result!.material).toBe(TestData.material);
    expect(result!.volume).toBe(TestData.volume);
    expect(result!.workingPressure).toBe(TestData.workingPressure);
    expect(result!.user).toBeUndefined();
  });

  it('will create a new user-defined tank profile', async () => {
    tankDocument.user = UserId;
    await tank.save();

    const result = await TankModel.findById(TestData._id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(TestData._id);
    expect(result!.name).toBe(TestData.name);
    expect(result!.material).toBe(TestData.material);
    expect(result!.volume).toBe(TestData.volume);
    expect(result!.workingPressure).toBe(TestData.workingPressure);
    expect(result!.user).toBe(UserId);
  });

  it('will update a tank profile', async () => {
    await tank.save();

    tank.name = 'Updated Tank';
    tank.material = TankMaterial.Steel;
    tank.volume = 13.22;
    tank.workingPressure = 140.5;
    await tank.save();

    const result = await TankModel.findById(TestData._id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(TestData._id);
    expect(result!.name).toBe('Updated Tank');
    expect(result!.material).toBe(TankMaterial.Steel);
    expect(result!.volume).toBe(13.22);
    expect(result!.workingPressure).toBe(140.5);
  });

  it('will delete a tank profile', async () => {
    await tankDocument.save();

    await expect(tank.delete()).resolves.toBe(true);

    const result = await TankModel.findById(TestData._id);
    expect(result).toBeNull();
  });

  it('will return false if the tank profile cannot be deleted', async () => {
    await expect(tank.delete()).resolves.toBe(false);
  });

  it('will return the JSON representation of the tank profile', () => {
    expect(tank.toJSON()).toEqual({
      id: TestData._id,
      name: TestData.name,
      material: TestData.material,
      volume: TestData.volume,
      workingPressure: TestData.workingPressure,
      isSystem: true,
    });
  });
});
