import { Collection } from 'mongodb';
import { createMocks } from 'node-mocks-http';

import { createTestLogger } from '../../../test-logger';
import { Collections, TankDocument } from '../../../../src/data';
import { mongoClient } from '../../../mongo-client';
import {
  PreDefinedTank,
  PreDefinedTankManager,
  TankManager,
} from '../../../../src/tanks';
import {
  createPreDefinedTank,
  deletePreDefinedTank,
  getPreDefinedTank,
  listPreDefinedTanks,
  loadPreDefinedTank,
  patchPreDefinedTank,
  updatePreDefinedTank,
} from '../../../../src/server/routes/tanks';
import { fakeTank } from '../../../fixtures/fake-tank';
import { faker } from '@faker-js/faker';
import { MissingResourceError, ValidationError } from '../../../../src/errors';

const Log = createTestLogger('tanks-routes');

describe('Pre-Defined Tank Profile Routes', () => {
  let tankManager: TankManager;
  let Tanks: Collection<TankDocument>;

  beforeAll(() => {
    tankManager = new PreDefinedTankManager(mongoClient, Log);
    Tanks = mongoClient.db().collection(Collections.Tanks);
  });

  it('Will return requested tank', () => {
    const tank = new PreDefinedTank(mongoClient, Log, fakeTank());
    const { req, res } = createMocks({
      log: Log,
      selectedTank: tank,
    });

    getPreDefinedTank(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(tank.toJSON());
  });

  describe('Loading Tank Profiles', () => {
    it('Will load the desired tank profile', async () => {
      const tankData = fakeTank();
      const expectedTank = new PreDefinedTank(mongoClient, Log, tankData);
      const { req, res } = createMocks({
        params: {
          tankId: tankData._id,
        },
        log: Log,
        tankManager,
      });
      const next = jest.fn();
      const getTank = jest
        .spyOn(tankManager, 'getTank')
        .mockResolvedValue(expectedTank);

      await loadPreDefinedTank(req, res, next);

      expect(getTank).toBeCalledWith(expectedTank.id);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
      expect(req.selectedTank).toEqual(expectedTank);
    });

    it('Will return a MissingResource error if the tank cannot be found', async () => {
      const tankId = faker.datatype.uuid();
      const { req, res } = createMocks({
        params: { tankId },
        log: Log,
        tankManager,
      });
      const next = jest.fn();
      const getTank = jest
        .spyOn(tankManager, 'getTank')
        .mockResolvedValue(undefined);

      await loadPreDefinedTank(req, res, next);

      expect(getTank).toBeCalledWith(tankId);
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
      expect(res._isEndCalled()).toBe(false);
      expect(req.selectedTank).toBeUndefined();
    });

    it('Will return a server error if the Tank Manager throws an exception', async () => {
      const error = new Error('lame');
      const tankId = faker.datatype.uuid();
      const { req, res } = createMocks({
        params: { tankId },
        log: Log,
        tankManager,
      });
      const next = jest.fn();
      const getTank = jest
        .spyOn(tankManager, 'getTank')
        .mockRejectedValue(error);

      await loadPreDefinedTank(req, res, next);

      expect(getTank).toBeCalledWith(tankId);
      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
      expect(req.selectedTank).toBeUndefined();
    });
  });

  describe('Creating Tank Profiles', () => {
    it('Will create a new tank', async () => {
      const data: any = fakeTank();
      delete data._id;
      const { req, res } = createMocks({
        body: data,
        log: Log,
        tankManager,
      });
      const next = jest.fn();

      await createPreDefinedTank(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(201);

      const response = res._getJSONData();
      data._id = response.id;
      const expectedTank = new PreDefinedTank(mongoClient, Log, data);
      expect(response).toEqual(expectedTank.toJSON());

      const tank = await Tanks.findOne({ _id: data._id });
      expect(tank).toEqual(data);
    });

    it('Will return a ValidationError if the request body is invalid', async () => {
      const { req, res } = createMocks({
        body: {
          name: 'A Totally Invalid Tank',
          material: 'Mithril',
          volume: -12.0,
          workingPressure: 'lots',
        },
        log: Log,
        tankManager,
      });
      const next = jest.fn();

      await createPreDefinedTank(req, res, next);

      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a ServerError if the Tank Manager throws an exception', async () => {
      const error = new Error('nope');
      const data: any = fakeTank();
      delete data._id;
      const { req, res } = createMocks({
        body: data,
        log: Log,
        tankManager,
      });
      const next = jest.fn();
      jest.spyOn(tankManager, 'createTank').mockRejectedValue(error);

      await createPreDefinedTank(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Updating Tank Profiles', () => {
    it('Will update a tank profile', async () => {
      let data = fakeTank();
      await Tanks.insertOne(data);

      data = fakeTank({ _id: data._id });
      const expected = new PreDefinedTank(mongoClient, Log, data);
      const { req, res } = createMocks({
        body: {
          name: data.name,
          material: data.material,
          volume: data.volume,
          workingPressure: data.workingPressure,
        },
        log: Log,
        selectedTank: expected,
        tankManager,
      });
      const next = jest.fn();

      await updatePreDefinedTank(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(expected.toJSON());

      const result = await Tanks.findOne({ _id: expected.id });
      expect(result).not.toBeNull();
      const actual = new PreDefinedTank(mongoClient, Log, result!);
      expect(actual).toEqual(expected);
    });

    it('Will return a ValidationError if the request body is invalid', async () => {
      const expected = fakeTank();
      const selectedTank = new PreDefinedTank(
        mongoClient,
        Log,
        Object.assign({}, expected),
      );
      const { req, res } = createMocks({
        body: {
          name: 'A Totally Invalid Tank',
          material: 'Mithril',
          volume: -12.0,
          workingPressure: 'lots',
        },
        log: Log,
        selectedTank,
        tankManager,
      });
      const next = jest.fn();
      await Tanks.insertOne(expected);

      await updatePreDefinedTank(req, res, next);

      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);

      const actual = await Tanks.findOne({ _id: selectedTank.id });
      expect(actual).toEqual(expected);
    });

    it('Will return ServerError if the save function throws an exception', async () => {
      const error = new Error('Faily McFailson');
      const selectedTank = new PreDefinedTank(mongoClient, Log, fakeTank());
      const data = fakeTank();
      const { req, res } = createMocks({
        body: {
          name: data.name,
          material: data.material,
          volume: data.volume,
          workingPressure: data.workingPressure,
        },
        log: Log,
        selectedTank,
        tankManager,
      });
      const next = jest.fn();
      jest.spyOn(selectedTank, 'save').mockRejectedValue(error);

      await updatePreDefinedTank(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Patching Tank Profiles', () => {
    it('Will patch a tank profile', async () => {
      const data = fakeTank();
      await Tanks.insertOne(data);

      data.name = 'New Name!';
      data.volume = 7.7;
      const expected = new PreDefinedTank(mongoClient, Log, data);
      const { req, res } = createMocks({
        body: {
          name: data.name,
          volume: data.volume,
        },
        log: Log,
        selectedTank: expected,
        tankManager,
      });
      const next = jest.fn();

      await patchPreDefinedTank(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(expected.toJSON());

      const result = await Tanks.findOne({ _id: expected.id });
      expect(result).not.toBeNull();
      const actual = new PreDefinedTank(mongoClient, Log, result!);
      expect(actual).toEqual(expected);
    });

    it('Will return ValidationError if request body is invalid', async () => {
      const expected = fakeTank();
      const selectedTank = new PreDefinedTank(
        mongoClient,
        Log,
        Object.assign({}, expected),
      );
      const { req, res } = createMocks({
        body: {
          name: 'A Totally Invalid Tank',
          material: 'Mithril',
          volume: -12.0,
          workingPressure: 'lots',
        },
        log: Log,
        selectedTank,
        tankManager,
      });
      const next = jest.fn();
      await Tanks.insertOne(expected);

      await patchPreDefinedTank(req, res, next);

      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);

      const actual = await Tanks.findOne({ _id: selectedTank.id });
      expect(actual).toEqual(expected);
    });

    it('Will return ServerError if tank manager throws an exception', async () => {
      const error = new Error('Faily McFailson');
      const selectedTank = new PreDefinedTank(mongoClient, Log, fakeTank());
      const data = fakeTank();
      const { req, res } = createMocks({
        body: {
          material: data.material,
          workingPressure: data.workingPressure,
        },
        log: Log,
        selectedTank,
        tankManager,
      });
      const next = jest.fn();
      jest.spyOn(selectedTank, 'save').mockRejectedValue(error);

      await patchPreDefinedTank(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Deleting Tanks', () => {
    it('Will delete a tank', async () => {
      const tank = new PreDefinedTank(mongoClient, Log, fakeTank());
      const { req, res } = createMocks({
        log: Log,
        selectedTank: tank,
        tankManager,
      });
      const next = jest.fn();
      const deleteSpy = jest.spyOn(tank, 'delete').mockResolvedValue();

      await deletePreDefinedTank(req, res, next);

      expect(deleteSpy).toBeCalled();
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
    });

    it('Will return a ServerError if the delete function throws an exception', async () => {
      const error = new Error('Lol, nope.');
      const tank = new PreDefinedTank(mongoClient, Log, fakeTank());
      const { req, res } = createMocks({
        log: Log,
        selectedTank: tank,
        tankManager,
      });
      const next = jest.fn();
      jest.spyOn(tank, 'delete').mockRejectedValue(error);

      await deletePreDefinedTank(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Listing Tanks', () => {
    it('Will return a list of tank profiles', async () => {
      const data = new Array<TankDocument>(12);
      for (let i = 0; i < data.length; i++) {
        data[i] = fakeTank();
      }
      const expected = data.map(
        (tank) => new PreDefinedTank(mongoClient, Log, tank),
      );
      const { req, res } = createMocks({
        log: Log,
        tankManager,
      });
      const next = jest.fn();
      jest.spyOn(tankManager, 'listTanks').mockResolvedValue(expected);

      await listPreDefinedTanks(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      const actual = res._getJSONData();
      expect(actual).toEqual(expected.map((tank) => tank.toJSON()));
    });

    it('Will return a ServerError if the tank manager throws an exception', async () => {
      const error = new Error('What tanks?');
      const { req, res } = createMocks({
        log: Log,
        tankManager,
      });
      const next = jest.fn();
      jest.spyOn(tankManager, 'listTanks').mockRejectedValue(error);

      await listPreDefinedTanks(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });
});
