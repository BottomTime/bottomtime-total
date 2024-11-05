import {
  ApiClient,
  CreateOrUpdateTankParamsDTO,
  Fetcher,
  Tank,
  TankDTO,
  TankMaterial,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { useCurrentUser, useToasts } from '../../../../src/store';
import AdminTankView from '../../../../src/views/admin/tank-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const TestData: TankDTO = {
  id: '776c6a29-faf0-4577-9092-90fcf8e5c9c4',
  name: 'Test Tank',
  volume: 12,
  workingPressure: 232,
  material: TankMaterial.Steel,
  isSystem: true,
};

const NameInput = '#name';
const VolumeInput = '#volume';
const PressureInput = '#pressure';
const AluminumRadio = '#material-al';
const SteelRadio = '#material-fe';
const SaveButton = '#save-tank';

describe('Admin Tank View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof AdminTankView>;
  let tankDto: TankDTO;
  let tank: Tank;
  let getSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/admin/tanks/new',
        component: AdminTankView,
      },
      {
        path: '/admin/tanks/:tankId',
        component: AdminTankView,
      },
    ]);
  });

  beforeEach(async () => {
    tankDto = TestData;
    tank = new Tank(fetcher, tankDto);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    toasts = useToasts(pinia);

    currentUser.user = AdminUser;

    await router.push(`/admin/tanks/${TestData.id}`);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };

    getSpy = jest.spyOn(client.tanks, 'getTank').mockResolvedValue(tank);
  });

  it('will display a tank profile', async () => {
    const wrapper = mount(AdminTankView, opts);
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(NameInput).element.value).toBe(
      TestData.name,
    );
    expect(wrapper.get<HTMLInputElement>(PressureInput).element.value).toBe(
      TestData.workingPressure.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(VolumeInput).element.value).toBe(
      TestData.volume.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(SteelRadio).element.checked).toBe(
      true,
    );
  });

  it('will allow a user to create a new tank profile', async () => {
    const expected: CreateOrUpdateTankParamsDTO = {
      name: 'New Name',
      volume: 15,
      workingPressure: 300,
      material: TankMaterial.Aluminum,
    };
    const tank = new Tank(fetcher, {
      ...TestData,
      ...expected,
    });
    const spy = jest.spyOn(client.tanks, 'createTank').mockResolvedValue(tank);

    await router.push('/admin/tanks/new');
    const wrapper = mount(AdminTankView, opts);
    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(VolumeInput).setValue(expected.volume.toString());
    await wrapper
      .get(PressureInput)
      .setValue(expected.workingPressure.toString());
    await wrapper.get(AluminumRadio).setValue(true);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(expected, AdminUser.username);
    expect(toasts.toasts[0].message).toMatchSnapshot();
    expect(router.currentRoute.value.params.tankId).toBe(TestData.id);
  });

  it('will allow a user to update a tank profile', async () => {
    const expected: TankDTO = {
      ...TestData,
      name: 'New Name',
      volume: 15,
      workingPressure: 300,
      material: TankMaterial.Aluminum,
    };

    const tank = new Tank(fetcher, expected);
    jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((dto) => {
      expect(dto).toEqual(expected);
      return tank;
    });
    const spy = jest.spyOn(tank, 'save').mockResolvedValue();

    const wrapper = mount(AdminTankView, opts);
    await flushPromises();

    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(VolumeInput).setValue(expected.volume.toString());
    await wrapper
      .get(PressureInput)
      .setValue(expected.workingPressure.toString());
    await wrapper.get(AluminumRadio).setValue(true);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(toasts.toasts[0].message).toMatchSnapshot();
  });

  it('will prevent users form saving tanks if there are validation errors', async () => {
    const spy = jest.spyOn(client.tanks, 'wrapDTO');

    const wrapper = mount(AdminTankView, opts);
    await flushPromises();

    await wrapper.get(VolumeInput).setValue('nope');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(toasts.toasts).toHaveLength(0);
    expect(
      wrapper.find('[data-testid="volume-error"]').text(),
    ).toMatchSnapshot();
  });

  it('will show a not found message if the tank does not exist', async () => {
    getSpy = jest
      .spyOn(client.tanks, 'getTank')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(AdminTankView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find(NameInput).exists()).toBe(false);
  });

  it('will show login form if user is not authenticated', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminTankView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find(NameInput).exists()).toBe(false);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('will show forbidden message if user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminTankView, opts);
    await flushPromises();

    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find(NameInput).exists()).toBe(false);
    expect(getSpy).not.toHaveBeenCalled();
  });
});
