import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserDTO,
  WeightUnit,
} from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';
import AxiosAdapter from 'axios-mock-adapter';

import { UserSettings } from '../../../src/client/user-settings';
import { BasicUser } from '../../fixtures/users';

describe('User Settings client object', () => {
  let axiosInstance: AxiosInstance;
  let axiosAdapter: AxiosAdapter;
  let settings: UserSettings;
  let testUser: UserDTO;

  beforeAll(() => {
    axiosInstance = axios.create();
    axiosAdapter = new AxiosAdapter(axiosInstance);

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
    axiosAdapter.reset();
  });

  afterAll(() => {
    axiosAdapter.restore();
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

    axiosAdapter
      .onPut(`/api/users/${testUser.username}/settings`, testUser.settings)
      .reply(204);

    await settings.save();

    expect(axiosAdapter.history.put).toHaveLength(1);
  });
});
