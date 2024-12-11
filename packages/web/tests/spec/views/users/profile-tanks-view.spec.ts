import {
  ApiClient,
  ApiList,
  Fetcher,
  ListTanksResponseSchema,
  TankDTO,
  TankMaterial,
  UserRole,
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
import ProfileTanksView from '../../../../src/views/users/profile-tanks-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import TestTankData from '../../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../../fixtures/users';

const DefaultUrl = `/profile/${BasicUser.username}/tanks`;

describe('Profile Tanks View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let tankData: ApiList<TankDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof ProfileTanksView>;
  let listSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/profile/:username/tanks',
        component: ProfileTanksView,
      },
    ]);
  });

  beforeEach(async () => {
    tankData = ListTanksResponseSchema.parse(TestTankData);
    tankData.data = tankData.data.slice(0, 9);
    tankData.totalCount = tankData.data.length;

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;

    await router.push(DefaultUrl);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: { teleport: true },
      },
    };

    listSpy = jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
  });

  it('will render list for profile owner', async () => {
    const wrapper = mount(ProfileTanksView, opts);
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith({
      includeSystem: false,
      username: BasicUser.username,
    });
    expect(
      wrapper.find('[data-testid="tanks-list-counts"]').text(),
    ).toMatchSnapshot();

    const items = wrapper.findAllComponents(TanksListItem);
    expect(items).toHaveLength(tankData.data.length);
    items.forEach((item, index) => {
      expect(
        item
          .get(`[data-testid="select-tank-${tankData.data[index].id}"]`)
          .text(),
      ).toContain(tankData.data[index].name);
    });
  });

  it('will render list for admin', async () => {
    currentUser.user = AdminUser;
    const wrapper = mount(ProfileTanksView, opts);
    await flushPromises();
    expect(
      wrapper.find('[data-testid="tanks-list-counts"]').text(),
    ).toMatchSnapshot();

    const items = wrapper.findAllComponents(TanksListItem);
    expect(items).toHaveLength(tankData.data.length);
    items.forEach((item, index) => {
      expect(
        item
          .get(`[data-testid="select-tank-${tankData.data[index].id}"]`)
          .text(),
      ).toContain(tankData.data[index].name);
    });
  });

  it('will redner login form if user is not authenticated', async () => {
    currentUser.user = null;
    const wrapper = mount(ProfileTanksView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
  });

  it('will render forbidden message if current user is not authorized to manage tanks for the target user', async () => {
    currentUser.user = UserWithFullProfile;
    const wrapper = mount(ProfileTanksView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="forbidden-message"]').exists()).toBe(
      true,
    );
  });

  it('will render not found message if the target user does not exist', async () => {
    jest
      .spyOn(client.tanks, 'listTanks')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(ProfileTanksView, opts);
    await flushPromises();
    expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-testid="not-found-message"]').exists()).toBe(
      true,
    );
  });

  [UserRole.Admin, UserRole.User].forEach((role) => {
    it(`will allow ${
      role === UserRole.Admin ? 'an admin' : 'profile owner'
    } to add a new tank`, async () => {
      currentUser.user = role === UserRole.Admin ? AdminUser : BasicUser;

      const expected: TankDTO = {
        id: 'f491fa9f-b93c-4448-b2d4-efc599262976',
        name: 'Some Custom Tank',
        isSystem: false,
        material: TankMaterial.Aluminum,
        volume: 10.5,
        workingPressure: 180,
      };

      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
      const spy = jest
        .spyOn(client.tanks, 'createTank')
        .mockResolvedValue(expected);

      const wrapper = mount(ProfileTanksView, opts);
      await flushPromises();

      await wrapper.get('#tanks-list-add').trigger('click');
      await wrapper.get('#name').setValue(expected.name);
      await wrapper.get('#material-al').setValue(true);
      await wrapper.get('#volume').setValue(expected.volume.toString());
      await wrapper
        .get('#pressure')
        .setValue(expected.workingPressure.toString());
      await wrapper.get('#save-tank').trigger('click');
      await flushPromises();

      expect(wrapper.find('#save-tank').exists()).toBe(false);
      expect(
        wrapper.find(`[data-testid="select-tank-${expected.id}"]`).text(),
      ).toBe(expected.name);

      expect(spy).toHaveBeenCalledWith(
        {
          ...expected,
          id: '',
        },
        BasicUser.username,
      );
    });

    it(`will allow ${
      role === UserRole.Admin ? 'an admin' : 'profile owner'
    } a user to delete a tank`, async () => {
      currentUser.user = role === UserRole.Admin ? AdminUser : BasicUser;
      const dto = tankData.data[4];

      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
      const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();

      const wrapper = mount(ProfileTanksView, opts);
      await flushPromises();

      await wrapper
        .get(`[data-testid="delete-tank-${dto.id}"]`)
        .trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(dto.id, BasicUser.username);
      expect(
        wrapper.find(`[data-testid="select-tank-${dto.id}"]`).exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-testid="dialog-confirm-button"]').exists(),
      ).toBe(false);
    });

    it(`will allow ${
      role === UserRole.Admin ? 'an admin' : 'profile owner'
    } to change their mind about deleting a tank`, async () => {
      currentUser.user = role === UserRole.Admin ? AdminUser : BasicUser;
      const dto = tankData.data[6];

      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
      const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();

      const wrapper = mount(ProfileTanksView, opts);
      await flushPromises();

      await wrapper
        .get(`[data-testid="delete-tank-${dto.id}"]`)
        .trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');

      expect(spy).not.toHaveBeenCalled();
      expect(
        wrapper.find(`[data-testid="select-tank-${dto.id}"]`).isVisible(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="dialog-cancel-button"]').exists(),
      ).toBe(false);
    });

    it(`will allow ${
      role === UserRole.Admin ? 'an admin' : 'profile owner'
    } to delete a tank from the drawer panel`, async () => {
      currentUser.user = role === UserRole.Admin ? AdminUser : BasicUser;
      const dto = tankData.data[4];

      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
      const spy = jest.spyOn(client.tanks, 'deleteTank').mockResolvedValue();

      const wrapper = mount(ProfileTanksView, opts);
      await flushPromises();

      await wrapper
        .get(`[data-testid="select-tank-${dto.id}"]`)
        .trigger('click');
      await wrapper.get('#delete-tank').trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(dto.id, BasicUser.username);
      expect(
        wrapper.find(`[data-testid="select-tank-${dto.id}"]`).exists(),
      ).toBe(false);
      expect(
        wrapper.find('[data-testid="dialog-confirm-button"]').exists(),
      ).toBe(false);
      expect(wrapper.find('#save-tank').exists()).toBe(false);
    });

    it(`will allow ${
      role === UserRole.Admin ? 'an admin' : 'profile owner'
    } to edit an existing tank profile`, async () => {
      const original = tankData.data[3];
      const updated: TankDTO = {
        ...original,
        name: 'Modernized Tank',
        material: TankMaterial.Steel,
        volume: 7.7,
        workingPressure: 255,
      };

      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);
      const spy = jest.spyOn(client.tanks, 'updateTank').mockResolvedValue();

      const wrapper = mount(ProfileTanksView, opts);
      await flushPromises();

      await wrapper
        .get(`[data-testid="select-tank-${original.id}"]`)
        .trigger('click');
      await wrapper.get('#name').setValue(updated.name);
      await wrapper.get('#material-fe').setValue(true);
      await wrapper.get('#volume').setValue(updated.volume.toString());
      await wrapper
        .get('#pressure')
        .setValue(updated.workingPressure.toString());
      await wrapper.get('#save-tank').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalledWith(updated);
      expect(wrapper.find('#save-tank').exists()).toBe(false);
      expect(
        wrapper.find(`[data-testid="tank-${original.id}"]`).html(),
      ).toMatchSnapshot();
    });
  });

  it('will not show Add button if user is at their custom tank profile limit', async () => {
    jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
      data: [
        ...tankData.data,
        {
          id: '04efab49-cbb3-4741-9b15-f0774f52118b',
          name: 'Final Tank',
          isSystem: false,
          material: TankMaterial.Steel,
          volume: 12.5,
          workingPressure: 240,
        },
      ],
      totalCount: tankData.totalCount + 1,
    });
    const wrapper = mount(ProfileTanksView, opts);
    await flushPromises();

    expect(wrapper.find('#tanks-list-add').exists()).toBe(false);
  });
});
