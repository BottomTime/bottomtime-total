import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserDTO,
  WeightUnit,
} from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';
import nock, { Scope } from 'nock';

import { UserSettings } from '../../../src/client/user-settings';
import { createScope } from '../../fixtures/nock';
import { BasicUser } from '../../fixtures/users';

describe('User Settings client object', () => {
  let axiosInstance: AxiosInstance;
  let settings: UserSettings;
  let testUser: UserDTO;
  let scope: Scope;

  beforeAll(() => {
    axiosInstance = axios.create();
    scope = createScope();

    testUser = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Meters,
        pressureUnit: PressureUnit.Bar,
        temperatureUnit: TemperatureUnit.Celsius,
        weightUnit: WeightUnit.Kilograms,
        profileVisibility: ProfileVisibility.Public,
      },
    };

    settings = new UserSettings(axiosInstance, testUser);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('will return properties correctly', () => {
    expect(settings.depthUnit).toBe(testUser.settings.depthUnit);
    expect(settings.pressureUnit).toBe(testUser.settings.pressureUnit);
    expect(settings.temperatureUnit).toBe(testUser.settings.temperatureUnit);
    expect(settings.weightUnit).toBe(testUser.settings.weightUnit);
    expect(settings.profileVisibility).toBe(
      testUser.settings.profileVisibility,
    );
  });

  it('will update properties correctly', () => {
    settings.depthUnit = DepthUnit.Feet;
    settings.pressureUnit = PressureUnit.PSI;
    settings.temperatureUnit = TemperatureUnit.Fahrenheit;
    settings.weightUnit = WeightUnit.Pounds;
    settings.profileVisibility = ProfileVisibility.Private;

    expect(settings.depthUnit).toBe(DepthUnit.Feet);
    expect(settings.pressureUnit).toBe(PressureUnit.PSI);
    expect(settings.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
    expect(settings.weightUnit).toBe(WeightUnit.Pounds);
    expect(settings.profileVisibility).toBe(ProfileVisibility.Private);

    expect(testUser.settings.depthUnit).toBe(DepthUnit.Feet);
    expect(testUser.settings.pressureUnit).toBe(PressureUnit.PSI);
    expect(testUser.settings.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
    expect(testUser.settings.weightUnit).toBe(WeightUnit.Pounds);
    expect(testUser.settings.profileVisibility).toBe(ProfileVisibility.Private);
  });

  it('will save changes upon request', async () => {
    settings.depthUnit = DepthUnit.Feet;
    settings.pressureUnit = PressureUnit.PSI;
    settings.temperatureUnit = TemperatureUnit.Fahrenheit;
    settings.weightUnit = WeightUnit.Pounds;
    settings.profileVisibility = ProfileVisibility.Private;
    scope
      .put(`/api/users/${testUser.username}/settings`, testUser.settings)
      .reply(204);

    await settings.save();

    expect(scope.isDone()).toBe(true);
  });
});
