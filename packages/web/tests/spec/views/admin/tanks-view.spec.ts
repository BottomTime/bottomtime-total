import {
  ApiClient,
  ApiList,
  Fetcher,
  ListTanksResponseSchema,
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
import TanksListItem from '../../../../src/components/tanks/tanks-list-item.vue';
import { useCurrentUser } from '../../../../src/store';
import AdminTanksView from '../../../../src/views/admin/tanks-view.vue';
import { createRouter } from '../../../fixtures/create-router';
import TestTankData from '../../../fixtures/tanks.json';
import { AdminUser, BasicUser } from '../../../fixtures/users';

const AddButton = 'button#tanks-list-add';
const MaterialRadio = {
  Aluminum: '#material-al',
  Steel: '#material-fe',
} as const;
const NameInput = '#name';
const VolumeInput = '#volume';
const PressureInput = '#pressure';

const SaveButton = 'button#save-tank';

describe('Admin Tanks View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let tankData: ApiList<TankDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof AdminTanksView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    tankData = ListTanksResponseSchema.parse(TestTankData);

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = AdminUser;

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    listSpy = jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
  });

  it('will render the tanks list', async () => {
    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();
    expect(
      wrapper.get('[data-testid="tanks-list-counts"]').text(),
    ).toMatchSnapshot();

    const items = wrapper.findAllComponents(TanksListItem);
    expect(items).toHaveLength(tankData.data.length);
    expect(listSpy).toHaveBeenCalledWith();
  });

  it('will render login form if user is not authenticated', async () => {
    currentUser.user = null;

    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
      false,
    );
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('will render forbidden message if user is not an admin', async () => {
    currentUser.user = BasicUser;

    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();

    expect(wrapper.get('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
      false,
    );
    expect(listSpy).not.toHaveBeenCalled();
  });

  it('will allow a user to delete a tank', async () => {
    const dto = tankData.data[3];
    const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();
    jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
      data: [dto],
      totalCount: 1,
    });

    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();

    await wrapper.get(`[data-testid="delete-tank-${dto.id}"]`).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(dto.id);
    expect(wrapper.find(`[data-testid="select-tank-${dto.id}"]`).exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="dialog-confirm-button"]').exists()).toBe(
      false,
    );
  });

  it('will allow a user to change their mind about deleting a tank', async () => {
    const dto = tankData.data[5];
    const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();

    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();

    await wrapper.get(`[data-testid="delete-tank-${dto.id}"]`).trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(
      wrapper.find(`[data-testid="select-tank-${dto.id}"]`).isVisible(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="dialog-cancel-button"]').exists()).toBe(
      false,
    );
  });

  it('will allow a user to create a new profile', async () => {
    const data: TankDTO = {
      id: 'e19dcf78-b7b5-4e12-8dbe-96a1ee498091',
      name: 'New Tank',
      volume: 12.5,
      workingPressure: 200,
      isSystem: true,
      material: TankMaterial.Aluminum,
    };

    const spy = jest.spyOn(client.tanks, 'createTank').mockResolvedValue(data);

    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();

    await wrapper.get(AddButton).trigger('click');
    await wrapper.get(NameInput).setValue(data.name);
    await wrapper.get(VolumeInput).setValue(data.volume);
    await wrapper.get(PressureInput).setValue(data.workingPressure);
    await wrapper.get(MaterialRadio.Aluminum).setValue(true);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(NameInput).exists()).toBe(false);
    expect(spy).toHaveBeenCalledWith({
      ...data,
      id: '',
    });
    const item = wrapper.findComponent(TanksListItem);
    expect(item.text()).toContain(data.name);
  });

  it('will allow a user to edit a profile', async () => {
    const name = 'New Name';
    const volume = 12.5;
    const workingPressure = 200;
    const dto = tankData.data[8];
    const expected: TankDTO = {
      ...dto,
      name,
      volume,
      workingPressure,
      material: TankMaterial.Steel,
    };
    const spy = jest.spyOn(client.tanks, 'updateTank').mockResolvedValue();

    const tankSelector = `[data-testid="select-tank-${dto.id}"]`;

    const wrapper = mount(AdminTanksView, opts);
    await flushPromises();

    await wrapper.get(tankSelector).trigger('click');
    await wrapper.get(NameInput).setValue(name);
    await wrapper.get(VolumeInput).setValue(volume);
    await wrapper.get(PressureInput).setValue(workingPressure);
    await wrapper.get(MaterialRadio.Steel).setValue(true);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find(NameInput).exists()).toBe(false);
    expect(spy).toHaveBeenCalledWith(expected);

    expect(wrapper.find(tankSelector).text()).toBe(name);
  });
});
