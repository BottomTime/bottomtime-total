import {
  DepthUnit,
  Fetcher,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserSettingsDTO,
  WeightUnit,
} from '@bottomtime/api';
import { ApiClient } from '@bottomtime/api';

import { flushPromises, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import EditSettings from '../../../../src/components/users/edit-settings.vue';
import { createRouter } from '../../../fixtures/create-router';
import { BasicUser } from '../../../fixtures/users';

describe('Edit Settings form', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let pinia: Pinia;
  let router: Router;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
  });

  it('will mount component', () => {
    const wrapper = mount(EditSettings, {
      props: {
        user: {
          ...BasicUser,
          settings: {
            depthUnit: DepthUnit.Feet,
            pressureUnit: PressureUnit.PSI,
            temperatureUnit: TemperatureUnit.Fahrenheit,
            weightUnit: WeightUnit.Pounds,
          },
        },
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    });

    expect(
      wrapper.get<HTMLInputElement>('input#depth-feet').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#pressure-psi').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#temperature-fahrenheit').element
        .checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#weight-pounds').element.checked,
    ).toBe(true);
  });

  it('will allow the user to change settings', async () => {
    const userData: UserDTO = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
      },
    };
    const update: UserSettingsDTO = {
      depthUnit: DepthUnit.Meters,
      pressureUnit: PressureUnit.Bar,
      temperatureUnit: TemperatureUnit.Celsius,
      weightUnit: WeightUnit.Kilograms,
    };
    const wrapper = mount(EditSettings, {
      props: {
        user: userData,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    });
    const spy = jest
      .spyOn(client.userProfiles, 'updateSettings')
      .mockResolvedValueOnce(userData);

    await wrapper.get('input#depth-meters').setValue(true);
    await wrapper.get('input#pressure-bar').setValue(true);
    await wrapper.get('input#temperature-celsius').setValue(true);
    await wrapper.get('input#weight-kilograms').setValue(true);
    await wrapper.get('[data-testid="save-settings"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(userData, update);

    expect(wrapper.emitted('save-settings')).toEqual([
      [
        {
          depthUnit: DepthUnit.Meters,
          pressureUnit: PressureUnit.Bar,
          temperatureUnit: TemperatureUnit.Celsius,
          weightUnit: WeightUnit.Kilograms,
        },
      ],
    ]);
  });

  it('will allow users to select all metric units', async () => {
    const userData: UserDTO = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
      },
    };
    const wrapper = mount(EditSettings, {
      props: {
        user: userData,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    });

    await wrapper.get('[data-testid="select-all-metric"]').trigger('click');

    expect(
      wrapper.get<HTMLInputElement>('input#depth-meters').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#pressure-bar').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#temperature-celsius').element
        .checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#weight-kilograms').element.checked,
    ).toBe(true);
  });

  it('will allow users to select all imperial units', async () => {
    const userData: UserDTO = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Meters,
        pressureUnit: PressureUnit.Bar,
        temperatureUnit: TemperatureUnit.Celsius,
        weightUnit: WeightUnit.Kilograms,
      },
    };
    const wrapper = mount(EditSettings, {
      props: {
        user: userData,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    });

    await wrapper.get('[data-testid="select-all-imperial"]').trigger('click');

    expect(
      wrapper.get<HTMLInputElement>('input#depth-feet').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#pressure-psi').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#temperature-fahrenheit').element
        .checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#weight-pounds').element.checked,
    ).toBe(true);
  });

  it('will allow user to cancel changes to their settings', async () => {
    const userData: UserDTO = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
      },
    };
    const wrapper = mount(EditSettings, {
      props: {
        user: userData,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    });

    // Change values
    await wrapper.get('input#depth-meters').setValue(true);
    await wrapper.get('input#pressure-bar').setValue(true);
    await wrapper.get('input#temperature-celsius').setValue(true);
    await wrapper.get('input#weight-kilograms').setValue(true);

    // Cancel changes
    await wrapper.get('[data-testid="cancel-settings"]').trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);

    expect(
      wrapper.get<HTMLInputElement>('input#depth-feet').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#pressure-psi').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#temperature-fahrenheit').element
        .checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#weight-pounds').element.checked,
    ).toBe(true);
  });

  it('will allow a user to change their mind about cancelling changes', async () => {
    const userData: UserDTO = {
      ...BasicUser,
      settings: {
        depthUnit: DepthUnit.Feet,
        pressureUnit: PressureUnit.PSI,
        temperatureUnit: TemperatureUnit.Fahrenheit,
        weightUnit: WeightUnit.Pounds,
      },
    };
    const wrapper = mount(EditSettings, {
      props: {
        user: userData,
      },
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    });

    // Change values
    await wrapper.get('input#depth-meters').setValue(true);
    await wrapper.get('input#pressure-bar').setValue(true);
    await wrapper.get('input#temperature-celsius').setValue(true);
    await wrapper.get('input#weight-kilograms').setValue(true);

    // Cancel changes
    await wrapper.get('[data-testid="cancel-settings"]').trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    expect(wrapper.find('[data-testid="dialog-modal"]').exists()).toBe(false);

    expect(
      wrapper.get<HTMLInputElement>('input#depth-meters').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#pressure-bar').element.checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#temperature-celsius').element
        .checked,
    ).toBe(true);
    expect(
      wrapper.get<HTMLInputElement>('input#weight-kilograms').element.checked,
    ).toBe(true);
  });
});
