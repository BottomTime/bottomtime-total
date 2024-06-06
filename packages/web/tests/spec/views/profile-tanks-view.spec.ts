import {
  ApiClient,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  TankDTO,
  TankMaterial,
  TankSchema,
  UserRole,
} from '@bottomtime/api';
import { Tank } from '@bottomtime/api/src/client/tank';

import {
  ComponentMountingOptions,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import TanksListItem from '../../../src/components/tanks/tanks-list-item.vue';
import { AppInitialState, useInitialState } from '../../../src/initial-state';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import ProfileTanksView from '../../../src/views/profile-tanks-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import TestTankData from '../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

const DefaultUrl = `/profile/${BasicUser.username}/tanks`;

jest.mock('../../../src/initial-state');

describe('Profile Tanks View', () => {
  let client: ApiClient;
  let router: Router;
  let tankData: ListTanksResponseDTO;

  let initialState: AppInitialState;
  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof ProfileTanksView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/profile/:username/tanks',
        component: ProfileTanksView,
      },
    ]);
    tankData = ListTanksResponseSchema.parse(TestTankData);
    tankData.tanks = tankData.tanks.slice(0, 9);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;

    jest.mocked(useInitialState).mockImplementation(() => initialState);

    location = new MockLocation();
    location.assign(DefaultUrl);

    await router.push(DefaultUrl);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  describe('when prefetching on the server side', () => {
    beforeEach(() => {
      initialState = { currentUser: null };
    });

    it('will render the login form if the user is not logged in', async () => {
      jest
        .spyOn(client.tanks, 'listTanks')
        .mockRejectedValue(createAxiosError(401));
      currentUser.user = null;
      initialState.currentUser = null;

      const html = document.createElement('div');
      html.innerHTML = await renderToString(ProfileTanksView, {
        global: opts.global,
      });

      expect(html.querySelector('[data-testid="login-form"]')).not.toBeNull();
      expect(
        html.querySelector('[data-testid="tanks-list-counts"]'),
      ).toBeNull();
    });

    it('will render a forbidden message if the current user is not authorized to manage tanks for the target user', async () => {
      jest
        .spyOn(client.tanks, 'listTanks')
        .mockRejectedValue(createAxiosError(403));

      currentUser.user = UserWithFullProfile;
      const html = document.createElement('div');
      html.innerHTML = await renderToString(ProfileTanksView, {
        global: opts.global,
      });

      expect(
        html.querySelector('[data-testid="forbidden-message"]'),
      ).not.toBeNull();
    });

    it('will render a not found message if the target user does not exist', async () => {
      jest
        .spyOn(client.tanks, 'listTanks')
        .mockRejectedValue(createAxiosError(404));

      const html = document.createElement('div');
      html.innerHTML = await renderToString(ProfileTanksView, {
        global: opts.global,
      });

      expect(
        html.querySelector('[data-testid="not-found-message"]'),
      ).not.toBeNull();
      expect(
        html.querySelector('[data-testid="tanks-list-counts"]'),
      ).toBeNull();
    });

    it('will render the form correctly for the profile owner', async () => {
      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
        tanks: tankData.tanks.map((tank) => new Tank(client.axios, tank)),
        totalCount: tankData.totalCount,
      });

      const html = document.createElement('div');
      html.innerHTML = await renderToString(ProfileTanksView, {
        global: opts.global,
      });

      expect(
        html.querySelector('[data-testid="tanks-list-counts"]')?.innerHTML,
      ).toMatchSnapshot();

      tankData.tanks.forEach((tank, index) => {
        expect(
          html.querySelector<HTMLButtonElement>(
            `[data-testid="select-tank-${tank.id}"]`,
          )?.innerHTML,
        ).toContain(tankData.tanks[index].name);
      });
    });

    it('will render correctly for an admin', async () => {
      currentUser.user = AdminUser;
      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
        tanks: tankData.tanks.map((tank) => new Tank(client.axios, tank)),
        totalCount: tankData.totalCount,
      });

      const html = document.createElement('div');
      html.innerHTML = await renderToString(ProfileTanksView, {
        global: opts.global,
      });

      expect(
        html.querySelector('[data-testid="tanks-list-counts"]')?.innerHTML,
      ).toMatchSnapshot();

      tankData.tanks.forEach((tank, index) => {
        expect(
          html.querySelector<HTMLButtonElement>(
            `[data-testid="select-tank-${tank.id}"]`,
          )?.innerHTML,
        ).toContain(tankData.tanks[index].name);
      });
    });
  });

  describe('when fetching on the client side', () => {
    beforeEach(() => {
      initialState = {
        currentUser: BasicUser,
        tanks: tankData,
      };
    });

    it('will render list for profile owner', async () => {
      const wrapper = mount(ProfileTanksView, opts);
      expect(
        wrapper.find('[data-testid="tanks-list-counts"]').text(),
      ).toMatchSnapshot();

      const items = wrapper.findAllComponents(TanksListItem);
      expect(items).toHaveLength(tankData.tanks.length);
      items.forEach((item, index) => {
        expect(
          item
            .get(`[data-testid="select-tank-${tankData.tanks[index].id}"]`)
            .text(),
        ).toContain(tankData.tanks[index].name);
      });
    });

    it('will render list for admin', async () => {
      currentUser.user = AdminUser;
      const wrapper = mount(ProfileTanksView, opts);
      expect(
        wrapper.find('[data-testid="tanks-list-counts"]').text(),
      ).toMatchSnapshot();

      const items = wrapper.findAllComponents(TanksListItem);
      expect(items).toHaveLength(tankData.tanks.length);
      items.forEach((item, index) => {
        expect(
          item
            .get(`[data-testid="select-tank-${tankData.tanks[index].id}"]`)
            .text(),
        ).toContain(tankData.tanks[index].name);
      });
    });

    it('will redner login form if user is not authenticated', async () => {
      currentUser.user = null;
      const wrapper = mount(ProfileTanksView, opts);
      expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
        false,
      );
      expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
    });

    it('will render forbidden message if current user is not authorized to manage tanks for the target user', async () => {
      currentUser.user = UserWithFullProfile;
      const wrapper = mount(ProfileTanksView, opts);
      expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
        false,
      );
      expect(wrapper.find('[data-testid="forbidden-message"]').exists()).toBe(
        true,
      );
    });

    it('will render not found message if the target user does not exist', async () => {
      initialState.tanks = undefined;
      const wrapper = mount(ProfileTanksView, opts);
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

        jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
          tanks: tankData.tanks.map((tank) => new Tank(client.axios, tank)),
          totalCount: tankData.totalCount,
        });
        // const spy = jest.spyOn()
        // const spy = jest.spyOn(tank, );

        const wrapper = mount(ProfileTanksView, opts);
        await wrapper.get('#tanks-list-add').trigger('click');
        await wrapper.get('#name').setValue('New Tank');

        // expect(spy).toHaveBeenCalledWith(BasicUser.username);
        expect(location.pathname).toBe('/tanks/add');
      });

      it(`will allow ${
        role === UserRole.Admin ? 'an admin' : 'profile owner'
      } a user to delete a tank`, async () => {});

      it(`will allow ${
        role === UserRole.Admin ? 'an admin' : 'profile owner'
      } to change their mind about deleting a tank`, async () => {});

      it(`will allow ${
        role === UserRole.Admin ? 'an admin' : 'profile owner'
      } to delete a tank from the drawer panel`, async () => {});
    });

    it('will not show Add button if user is at their custom tank profile limit', async () => {});
  });
});
