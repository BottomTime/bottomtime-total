import mockFetch from 'fetch-mock-jest';

import { Fetcher } from '../../src/client/fetcher';
import { UserSettings } from '../../src/client/user-settings';
import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  WeightUnit,
} from '../../src/types';
import { BasicUser } from '../fixtures/users';

describe('User Settings client object', () => {
  let fetcher: Fetcher;
  let settings: UserSettings;
  let testUser: UserDTO;

  beforeAll(() => {
    fetcher = new Fetcher();

    testUser = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Meters,
        pressureUnit: PressureUnit.Bar,
        temperatureUnit: TemperatureUnit.Celsius,
        weightUnit: WeightUnit.Kilograms,
      },
    };

    settings = new UserSettings(fetcher, testUser);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(settings.depthUnit).toBe(testUser.settings.depthUnit);
    expect(settings.pressureUnit).toBe(testUser.settings.pressureUnit);
    expect(settings.temperatureUnit).toBe(testUser.settings.temperatureUnit);
    expect(settings.weightUnit).toBe(testUser.settings.weightUnit);
  });

  it('will update properties correctly', () => {
    settings.depthUnit = DepthUnit.Feet;
    settings.pressureUnit = PressureUnit.PSI;
    settings.temperatureUnit = TemperatureUnit.Fahrenheit;
    settings.weightUnit = WeightUnit.Pounds;

    expect(settings.depthUnit).toBe(DepthUnit.Feet);
    expect(settings.pressureUnit).toBe(PressureUnit.PSI);
    expect(settings.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
    expect(settings.weightUnit).toBe(WeightUnit.Pounds);

    expect(testUser.settings.depthUnit).toBe(DepthUnit.Feet);
    expect(testUser.settings.pressureUnit).toBe(PressureUnit.PSI);
    expect(testUser.settings.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
    expect(testUser.settings.weightUnit).toBe(WeightUnit.Pounds);
  });

  it('will save changes upon request', async () => {
    settings.depthUnit = DepthUnit.Feet;
    settings.pressureUnit = PressureUnit.PSI;
    settings.temperatureUnit = TemperatureUnit.Fahrenheit;
    settings.weightUnit = WeightUnit.Pounds;

    mockFetch.put(
      `/api/users/${testUser.username}/settings`,
      testUser.settings,
    );

    await settings.save();

    expect(mockFetch.done()).toBe(true);
  });
});
