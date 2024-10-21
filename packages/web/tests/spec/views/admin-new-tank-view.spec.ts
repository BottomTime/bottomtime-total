import {
  ApiClient,
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

import { ApiClientKey } from '../../../src/api-client';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import AdminNewTankView from '../../../src/views/admin-new-tank-view.vue';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

const TestData: TankDTO = {
  id: 'f3f8bb4c-d291-4f99-9611-4e0ce834000f',
  name: 'Bestest Tank',
  volume: 12,
  workingPressure: 232,
  material: TankMaterial.Steel,
  isSystem: true,
};

describe('Admin New Tank view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let location: MockLocation;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof AdminNewTankView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    location = new MockLocation();
    location.assign('/admin/tanks/new');
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = AdminUser;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will allow a user to create a new tank', async () => {
    const spy = jest
      .spyOn(client.tanks, 'createTank')
      .mockResolvedValue(new Tank(fetcher, TestData));

    const wrapper = mount(AdminNewTankView, opts);
    await wrapper.get('#name').setValue(TestData.name);
    await wrapper.get('#volume').setValue(TestData.volume.toString());
    await wrapper
      .get('#pressure')
      .setValue(TestData.workingPressure.toString());
    await wrapper.get('#material-fe').setValue(true);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith({
      ...TestData,
      id: '',
    });
    expect(location.pathname).toBe(`/admin/tanks/${TestData.id}`);
  });

  it('will not attempt to create a tank if the validation fails', async () => {
    const spy = jest.spyOn(client.tanks, 'createTank');

    const wrapper = mount(AdminNewTankView, opts);
    await wrapper.get('#volume').setValue('nope');
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(location.pathname).toBe('/admin/tanks/new');
    expect(
      wrapper.find('[data-testid="edit-tank-form-errors"]').text(),
    ).toMatchSnapshot();
  });

  it('will display the login form if the user is not authenticated', async () => {
    currentUser.user = null;
    const wrapper = mount(AdminNewTankView, opts);
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
    expect(wrapper.find('#name').exists()).toBe(false);
  });

  it('will display a forbidden message if the user is not an admin', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(AdminNewTankView, opts);
    expect(wrapper.find('[data-testid="forbidden-message"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('#name').exists()).toBe(false);
  });
});
