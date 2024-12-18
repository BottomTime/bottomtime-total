import { ApiClient, Fetcher, TankDTO, TankMaterial } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import { useCurrentUser, useToasts } from '../../../../src/store';
import ProfileTankView from '../../../../src/views/users/profile-tank-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../../fixtures/users';

const TestData: TankDTO = {
  id: '1ec5cdb9-949c-4592-8a41-79d886e5cb1b',
  name: 'Test Tank',
  isSystem: false,
  material: TankMaterial.Aluminum,
  volume: 11.1,
  workingPressure: 300,
};

const DefaultUrl = `/profile/${BasicUser.username}/tanks/${TestData.id}`;

describe('Profile Tank View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof ProfileTankView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/profile/:username/tanks/new',
        component: ProfileTankView,
      },
      {
        path: '/profile/:username/tanks',
        component: { template: '' },
      },
      {
        path: '/profile/:username/tanks/:tankId',
        component: ProfileTankView,
      },
    ]);
  });

  beforeEach(async () => {
    await router.push(DefaultUrl);

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    toasts = useToasts(pinia);
    currentUser.user = BasicUser;
    jest.spyOn(client.tanks, 'getTank').mockResolvedValue({ ...TestData });

    opts = {
      global: {
        plugins: [router, pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    };
  });

  it('will show the login form if the user is not authenticated', async () => {
    currentUser.user = null;
    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
    expect(wrapper.find('#name').exists()).toBe(false);
  });

  it("will show a forbidden message if the current user is not authorized to edit the target user's profile", async () => {
    currentUser.user = UserWithFullProfile;
    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="forbidden-message"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('#name').exists()).toBe(false);
  });

  it('will show a not found message if the tank does not exist', async () => {
    jest.spyOn(client.tanks, 'getTank').mockRejectedValue(createHttpError(404));
    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="not-found-message"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('#name').exists()).toBe(false);
  });

  it('will allow a user to create a tank', async () => {
    await router.push(`/profile/${BasicUser.username}/tanks/new`);
    const expected: TankDTO = {
      ...TestData,
      name: 'Updated Tank',
      volume: 9.78,
      workingPressure: 180,
      material: TankMaterial.Steel,
    };
    const createSpy = jest
      .spyOn(client.tanks, 'createTank')
      .mockResolvedValue(expected);

    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#name').setValue(expected.name);
    await wrapper.get('#volume').setValue(expected.volume.toString());
    await wrapper
      .get('#pressure')
      .setValue(expected.workingPressure.toString());
    await wrapper.get('#material-fe').setValue(true);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(createSpy).toHaveBeenCalledWith(
      {
        id: '',
        isSystem: false,
        material: TankMaterial.Steel,
        name: 'Updated Tank',
        volume: 9.78,
        workingPressure: 180,
      },
      BasicUser.username,
    );
    expect(router.currentRoute.value.path).toBe(
      `/profile/${BasicUser.username}/tanks/${expected.id}`,
    );
  });

  it('will allow a user to update a tank', async () => {
    const expected: TankDTO = {
      ...TestData,
      name: 'Updated Tank',
      volume: 9.78,
      workingPressure: 180,
      material: TankMaterial.Steel,
    };
    const spy = jest.spyOn(client.tanks, 'updateTank').mockResolvedValue();

    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#name').setValue(expected.name);
    await wrapper.get('#volume').setValue(expected.volume.toString());
    await wrapper
      .get('#pressure')
      .setValue(expected.workingPressure.toString());
    await wrapper.get('#material-fe').setValue(true);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(expected, BasicUser.username);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('tank-saved');
  });

  it('will allow a user to delete a tank', async () => {
    const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();

    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#delete-tank').trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(TestData.id, BasicUser.username);
    expect(router.currentRoute.value.path).toBe(
      `/profile/${BasicUser.username}/tanks`,
    );
  });

  it('will allow a user to change their mind about deleting a tank', async () => {
    const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();
    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#delete-tank').trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="dialog-cancel-button"]').exists()).toBe(
      false,
    );
    expect(router.currentRoute.value.path).toBe(DefaultUrl);
  });

  it('will allow an admin to update a tank', async () => {
    currentUser.user = AdminUser;
    const expected: TankDTO = {
      ...TestData,
      name: 'Updated Tank',
      volume: 9.78,
      workingPressure: 180,
      material: TankMaterial.Steel,
    };
    const spy = jest.spyOn(client.tanks, 'updateTank').mockResolvedValue();

    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#name').setValue(expected.name);
    await wrapper.get('#volume').setValue(expected.volume.toString());
    await wrapper
      .get('#pressure')
      .setValue(expected.workingPressure.toString());
    await wrapper.get('#material-fe').setValue(true);
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(expected, BasicUser.username);
    expect(toasts.toasts).toHaveLength(1);
    expect(toasts.toasts[0].id).toBe('tank-saved');
  });

  it('will not submit a save request if validation fails', async () => {
    const spy = jest.spyOn(client.tanks, 'updateTank').mockResolvedValue();

    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#volume').setValue('nope');
    await wrapper.get('#save-tank').trigger('click');
    await flushPromises();

    expect(spy).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="edit-tank-form-errors"]').text(),
    ).toMatchSnapshot();
  });

  it('will allow an admin to delete a tank', async () => {
    currentUser.user = AdminUser;
    const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();

    const wrapper = mount(ProfileTankView, opts);
    await flushPromises();

    await wrapper.get('#delete-tank').trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(TestData.id, BasicUser.username);
    expect(router.currentRoute.value.path).toBe(
      `/profile/${BasicUser.username}/tanks`,
    );
  });
});
