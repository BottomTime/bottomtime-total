import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserSettingsDTO,
  WeightUnit,
} from '@bottomtime/api';
import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import EditSettings from '../../../src/components/users/edit-settings.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import SettingsView from '../../../src/views/settings-view.vue';
import { createRouter } from '../../fixtures/create-router';
import { BasicUser } from '../../fixtures/users';

describe('Account View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof SettingsView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: new MockLocation(),
        },
      },
    };
  });

  it('will display the login form if user is unauthenticated', () => {
    const currentUser = useCurrentUser(pinia);
    currentUser.user = null;
    const wrapper = mount(SettingsView, opts);
    expect(
      wrapper.get('[data-testid="require-auth-anonymous"]').isVisible(),
    ).toBe(true);
  });

  it('will allow user to update their settings', () => {
    const newSettings: UserSettingsDTO = {
      depthUnit: DepthUnit.Feet,
      pressureUnit: PressureUnit.PSI,
      temperatureUnit: TemperatureUnit.Fahrenheit,
      weightUnit: WeightUnit.Pounds,
    };
    const currentUser = useCurrentUser(pinia);
    currentUser.user = { ...BasicUser, settings: { ...BasicUser.settings } };
    const wrapper = mount(SettingsView, opts);
    const editSettings = wrapper.findComponent(EditSettings);

    editSettings.vm.$emit('save-settings', newSettings);

    expect(currentUser.user?.settings).toEqual(newSettings);
  });
});
