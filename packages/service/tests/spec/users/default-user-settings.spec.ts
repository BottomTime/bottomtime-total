import { Collection } from 'mongodb';

import { createTestLogger } from '../../test-logger';
import { Collections, UserDocument } from '../../../src/data';
import { DefaultUserSettings } from '../../../src/users';
import { mongoClient } from '../../mongo-client';
import { fakeUser } from '../../fixtures/fake-user';
import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  WeightUnit,
} from '../../../src/constants';

const Log = createTestLogger('default-user-settings');

describe('Default User Settings', () => {
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
  });

  it('Will return defaults for all properties', () => {
    const data = fakeUser();
    const settings = new DefaultUserSettings(mongoClient, Log, data);
    expect(settings.toJSON()).toEqual({
      depthUnit: DepthUnit.Meters,
      pressureUnit: PressureUnit.Bar,
      temperatureUnit: TemperatureUnit.Celsius,
      weightUnit: WeightUnit.Kilograms,
    });
  });

  it('Will return properties stored in data model', () => {
    const data = fakeUser({
      settings: {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
      },
    });
    const settings = new DefaultUserSettings(mongoClient, Log, data);
    expect(settings.toJSON()).toEqual({
      depthUnit: DepthUnit.Feet,
      pressureUnit: PressureUnit.PSI,
      temperatureUnit: TemperatureUnit.Fahrenheit,
      weightUnit: WeightUnit.Pounds,
    });
  });

  it('Will allow properties to be set', () => {
    const data = fakeUser();
    const settings = new DefaultUserSettings(mongoClient, Log, data);

    settings.depthUnit = DepthUnit.Feet;
    settings.pressureUnit = PressureUnit.PSI;
    settings.temperatureUnit = TemperatureUnit.Fahrenheit;
    settings.weightUnit = WeightUnit.Pounds;

    expect(settings.toJSON()).toEqual({
      depthUnit: DepthUnit.Feet,
      pressureUnit: PressureUnit.PSI,
      temperatureUnit: TemperatureUnit.Fahrenheit,
      weightUnit: WeightUnit.Pounds,
    });
  });

  it('Will save settings to the database for a new user', async () => {
    const data = fakeUser();
    await Users.insertOne(data);
    const settings = new DefaultUserSettings(mongoClient, Log, data);

    await settings.save();

    const result = await Users.findOne({ _id: data._id });
    expect(result?.settings).toEqual(settings.toJSON());
  });

  it('Will update settings for a user that already has them saved', async () => {
    const data = fakeUser();
    await Users.insertOne(data);
    const settings = new DefaultUserSettings(mongoClient, Log, data);

    settings.depthUnit = DepthUnit.Feet;
    settings.pressureUnit = PressureUnit.PSI;
    settings.temperatureUnit = TemperatureUnit.Fahrenheit;
    settings.weightUnit = WeightUnit.Pounds;
    await settings.save();

    const result = await Users.findOne({ _id: data._id });
    expect(result?.settings).toEqual({
      depthUnit: DepthUnit.Feet,
      pressureUnit: PressureUnit.PSI,
      temperatureUnit: TemperatureUnit.Fahrenheit,
      weightUnit: WeightUnit.Pounds,
    });
  });
});
