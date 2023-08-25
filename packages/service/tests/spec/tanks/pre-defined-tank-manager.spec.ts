import { Collection } from 'mongodb';
import { Collections, TankDocument, TankSchema } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import { fakeTank } from '../../fixtures/fake-tank';
import { mongoClient } from '../../mongo-client';
import {
  PreDefinedTank,
  PreDefinedTankManager,
  TankData,
  TankManager,
} from '../../../src/tanks';
import { ValidationError } from '../../../src/errors';

import PreDefinedTanks from '../../fixtures/pre-defined-tanks.json';
import { TankMaterial } from '../../../src/constants';

const Log = createTestLogger('pre-defined-tank-manager');

describe('Pre-Defined Tank Manager', () => {
  let Tanks: Collection<TankDocument>;
  let tankManager: TankManager;

  beforeAll(() => {
    Tanks = mongoClient.db().collection(Collections.Tanks);
  });

  beforeEach(() => {
    tankManager = new PreDefinedTankManager(mongoClient, Log);
  });

  it('Will create a new tank', async () => {
    const data = fakeTank({ _id: '' });
    const expected = new PreDefinedTank(mongoClient, Log, data);

    const actual = await tankManager.createTank({
      name: data.name,
      material: data.material,
      volume: data.volume,
      workingPressure: data.workingPressure,
    });

    data._id = actual.id;
    expect(actual).toEqual(expected);
  });

  it('Will throw a validation error when creating a tank with invalid options', async () => {
    const options: TankData = {
      name: 'Tank',
      material: TankMaterial.Aluminum,
      volume: 12.0,
      workingPressure: -37.5,
    };
    await expect(tankManager.createTank(options)).rejects.toThrowError(
      ValidationError,
    );

    const results = await Tanks.find({}).toArray();
    expect(results).toHaveLength(0);
  });

  it('Will retrieve a tank by its ID', async () => {
    const data = fakeTank();
    const expected = new PreDefinedTank(mongoClient, Log, data);
    await Tanks.insertOne(data);
    const actual = await tankManager.getTank(expected.id);
    expect(actual).toEqual(expected);
  });

  it('Will return undefined when a request is made for a tank that does not exist', async () => {
    await expect(
      tankManager.getTank('c5b4990f-e947-4f6e-8aa4-32b90de40446'),
    ).resolves.toBeUndefined();
  });

  it('Will list the predefined tanks, ordered by name', async () => {
    await Tanks.insertMany(
      PreDefinedTanks.map((tank) => TankSchema.parse(tank)),
    );
    await expect(tankManager.listTanks()).resolves.toMatchSnapshot();
  });
});
