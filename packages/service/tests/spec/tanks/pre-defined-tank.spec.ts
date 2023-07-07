import { Collection } from 'mongodb';
import { Collections, TankDocument } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import { fakeTank } from '../../fixtures/fake-tank';
import { mongoClient } from '../../mongo-client';
import { PreDefinedTank } from '../../../src/tanks';
import { TankMaterial } from '../../../src/constants';
import { ValidationError } from '../../../src/errors';

const Log = createTestLogger('pre-defined-tank');

describe('Pre-defined Tank', () => {
  let Tanks: Collection<TankDocument>;

  beforeAll(() => {
    Tanks = mongoClient.db().collection(Collections.Tanks);
  });

  it('Will return properties correctly', () => {
    const data = fakeTank();
    const tank = new PreDefinedTank(mongoClient, Log, data);

    expect(tank.id).toEqual(data._id);
    expect(tank.name).toEqual(data.name);
    expect(tank.material).toEqual(data.material);
    expect(tank.volume).toEqual(data.volume);
    expect(tank.workingPressure).toEqual(data.workingPressure);

    expect(tank.preDefined).toBe(true);
    expect(tank.owner).toBeUndefined();
  });

  it('Will update properties', async () => {
    const oldData = fakeTank();
    const tank = new PreDefinedTank(mongoClient, Log, oldData);

    const newData = fakeTank();

    tank.name = newData.name;
    tank.material = newData.material;
    tank.volume = newData.volume;
    tank.workingPressure = newData.workingPressure;

    expect(tank.name).toEqual(newData.name);
    expect(tank.material).toEqual(newData.material);
    expect(tank.volume).toEqual(newData.volume);
    expect(tank.workingPressure).toEqual(newData.workingPressure);
  });

  it('Will save a new tank data', async () => {
    const expected = fakeTank();
    const tank = new PreDefinedTank(mongoClient, Log, expected);
    await tank.save();
    const actual = await Tanks.findOne({ _id: expected._id });
    expect(actual).toEqual(expected);
  });

  it('Will update an existing tank', async () => {
    const oldData = fakeTank({ material: TankMaterial.Steel });
    const newData = fakeTank({
      _id: oldData._id,
      material: TankMaterial.Aluminum,
    });
    await Tanks.insertOne(oldData);

    const tank = new PreDefinedTank(mongoClient, Log, oldData);
    tank.name = newData.name;
    tank.material = newData.material;
    tank.volume = newData.volume;
    tank.workingPressure = newData.workingPressure;
    await tank.save();

    const actual = await Tanks.findOne({ _id: tank.id });
    expect(actual).toEqual(newData);
  });

  it('Will throw ValidationError if save() is called while tank properties are invalid', async () => {
    const data = fakeTank({ workingPressure: -7 });
    const tank = new PreDefinedTank(mongoClient, Log, data);
    await expect(tank.save()).rejects.toThrowError(ValidationError);
    const saved = await Tanks.findOne({ _id: data._id });
    expect(saved).toBeNull();
  });

  it('Will delete a tank', async () => {
    const data = fakeTank();
    await Tanks.insertOne(data);

    const tank = new PreDefinedTank(mongoClient, Log, data);
    await tank.delete();

    const actual = await Tanks.findOne({ _id: tank.id });
    expect(actual).toBeNull();
  });
});
