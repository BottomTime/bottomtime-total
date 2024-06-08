import { ApiClient, TankDTO, TankMaterial } from '@bottomtime/api';
import { Tank } from '@bottomtime/api/src/client/tank';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useToasts } from '../../../src/store';
import ProfileNewTankView from '../../../src/views/profile-new-tank-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

const DefaultUrl = `/profile/${BasicUser.username}/tanks/new`;

const TestData: TankDTO = {
  id: '3a3d7f74-f94f-4787-8f65-2636aee3ae7a',
  name: 'Freshest of All Tanks',
  isSystem: false,
  material: TankMaterial.Aluminum,
  volume: 11.6,
  workingPressure: 260,
};

describe('New Profile Tank view', () => {
  let client: ApiClient;
  let router: Router;

  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof ProfileNewTankView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/profile/:username/tanks/new',
        component: ProfileNewTankView,
      },
    ]);
  });

  beforeEach(async () => {
    location = new MockLocation();
    location.assign(DefaultUrl);

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    toasts = useToasts(pinia);
    currentUser.user = AdminUser;

    await router.push(DefaultUrl);

    opts = {
      global: {
        plugins: [router, pinia],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  it('will show the login form if the user is not logged in', async () => {
    currentUser.user = null;
    const wrapper = mount(ProfileNewTankView, opts);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.find('#name').exists()).toBe(false);
  });

  it("will show a forbidden message if the current user is not authorized to edit the target user's profile", async () => {
    currentUser.user = UserWithFullProfile;
    const wrapper = mount(ProfileNewTankView, opts);
    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.find('#name').exists()).toBe(false);
  });

  it('will allow a user to create a tank', async () => {
    const spy = jest
      .spyOn(client.tanks, 'createTank')
      .mockResolvedValue(new Tank(client.axios, TestData));

    const wrapper = mount(ProfileNewTankView, opts);
    await wrapper.get('#name').setValue(TestData.name);
    await wrapper.get('#material-al').setValue(true);
    await wrapper.get('#volume').setValue(TestData.volume);
    await wrapper.get('#pressure').setValue(TestData.workingPressure);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      {
        ...TestData,
        id: '',
      },
      BasicUser.username,
    );
    expect(location.pathname).toBe(
      `/profile/${BasicUser.username}/tanks/${TestData.id}`,
    );
  });

  it('will allow an admin to create a tank for another user', async () => {
    currentUser.user = AdminUser;
    const spy = jest
      .spyOn(client.tanks, 'createTank')
      .mockResolvedValue(new Tank(client.axios, TestData));

    const wrapper = mount(ProfileNewTankView, opts);
    await wrapper.get('#name').setValue(TestData.name);
    await wrapper.get('#material-al').setValue(true);
    await wrapper.get('#volume').setValue(TestData.volume);
    await wrapper.get('#pressure').setValue(TestData.workingPressure);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      {
        ...TestData,
        id: '',
      },
      BasicUser.username,
    );
    expect(location.pathname).toBe(
      `/profile/${BasicUser.username}/tanks/${TestData.id}`,
    );
  });

  it('will not attempt to create a tank if validation fails', async () => {
    const spy = jest.spyOn(client.tanks, 'createTank');
    const wrapper = mount(ProfileNewTankView, opts);
    await wrapper.get('#volume').setValue(0);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(
      wrapper.find('[data-testid="edit-tank-form-errors"]').text(),
    ).toMatchSnapshot();
    expect(spy).not.toHaveBeenCalled();
  });

  it('will render a toast message if the request fails because the user is at their tank limit', async () => {
    jest
      .spyOn(client.tanks, 'createTank')
      .mockRejectedValue(createAxiosError(405));
    const wrapper = mount(ProfileNewTankView, opts);

    await wrapper.get('#name').setValue(TestData.name);
    await wrapper.get('#material-al').setValue(true);
    await wrapper.get('#volume').setValue(TestData.volume);
    await wrapper.get('#pressure').setValue(TestData.workingPressure);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('tank-limit-reached');
    expect(toasts.toasts[0].message).toMatchSnapshot();
  });
});
