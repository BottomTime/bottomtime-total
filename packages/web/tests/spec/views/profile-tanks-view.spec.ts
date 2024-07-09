import {
  ApiClient,
  Fetcher,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  Tank,
  TankDTO,
  TankMaterial,
  UserRole,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import TanksListItem from '../../../src/components/tanks/tanks-list-item.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useTanks } from '../../../src/store';
import ProfileTanksView from '../../../src/views/profile-tanks-view.vue';
import { createHttpError } from '../../fixtures/create-http-error';
import { createRouter } from '../../fixtures/create-router';
import TestTankData from '../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

const DefaultUrl = `/profile/${BasicUser.username}/tanks`;

describe('Profile Tanks View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let tankData: ListTanksResponseDTO;

  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let tanks: ReturnType<typeof useTanks>;
  let opts: ComponentMountingOptions<typeof ProfileTanksView>;

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
    tankData.tanks = tankData.tanks.slice(0, 9);
    tankData.totalCount = tankData.tanks.length;

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    tanks = useTanks(pinia);
    currentUser.user = BasicUser;

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
    it('will render the login form if the user is not logged in', async () => {
      jest
        .spyOn(client.tanks, 'listTanks')
        .mockRejectedValue(createHttpError(401));
      currentUser.user = null;

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
        .mockRejectedValue(createHttpError(403));

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
        .mockRejectedValue(createHttpError(404));

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
        tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
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
        tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
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
      currentUser.user = BasicUser;
      tanks.results = tankData;
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
      tanks.results = {
        tanks: [],
        totalCount: -1,
      };
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
          tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
          totalCount: tankData.totalCount,
        });
        const spy = jest
          .spyOn(client.tanks, 'createTank')
          .mockResolvedValue(new Tank(fetcher, expected));

        const wrapper = mount(ProfileTanksView, opts);
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
        const dto = tankData.tanks[4];
        const tank = new Tank(fetcher, dto);

        jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
          tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
          totalCount: tankData.totalCount,
        });
        jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((data) => {
          expect(data).toEqual(dto);
          return tank;
        });
        const spy = jest.spyOn(tank, 'delete').mockResolvedValue();

        const wrapper = mount(ProfileTanksView, opts);
        await wrapper
          .get(`[data-testid="delete-tank-${dto.id}"]`)
          .trigger('click');
        await wrapper
          .get('[data-testid="dialog-confirm-button"]')
          .trigger('click');
        await flushPromises();

        expect(spy).toHaveBeenCalled();
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
        const dto = tankData.tanks[6];

        jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
          tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
          totalCount: tankData.totalCount,
        });
        const spy = jest.spyOn(client.tanks, 'wrapDTO');

        const wrapper = mount(ProfileTanksView, opts);
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
        const dto = tankData.tanks[4];
        const tank = new Tank(fetcher, dto);

        jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
          tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
          totalCount: tankData.totalCount,
        });
        jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((data) => {
          expect(data).toEqual(dto);
          return tank;
        });
        const spy = jest.spyOn(tank, 'delete').mockResolvedValue();

        const wrapper = mount(ProfileTanksView, opts);
        await wrapper
          .get(`[data-testid="select-tank-${dto.id}"]`)
          .trigger('click');
        await wrapper.get('#delete-tank').trigger('click');
        await wrapper
          .get('[data-testid="dialog-confirm-button"]')
          .trigger('click');
        await flushPromises();

        expect(spy).toHaveBeenCalled();
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
        const original = tankData.tanks[3];
        const updated: TankDTO = {
          ...original,
          name: 'Modernized Tank',
          material: TankMaterial.Steel,
          volume: 7.7,
          workingPressure: 255,
        };
        const tank = new Tank(fetcher, updated);

        jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
          tanks: tankData.tanks.map((tank) => new Tank(fetcher, tank)),
          totalCount: tankData.totalCount,
        });
        jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((data) => {
          expect(data).toEqual(updated);
          return tank;
        });
        const spy = jest.spyOn(tank, 'save').mockResolvedValue();

        const wrapper = mount(ProfileTanksView, opts);
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

        expect(spy).toHaveBeenCalled();
        expect(wrapper.find('#save-tank').exists()).toBe(false);
        expect(
          wrapper.find(`[data-testid="tank-${original.id}"]`).html(),
        ).toMatchSnapshot();
      });
    });

    it('will not show Add button if user is at their custom tank profile limit', async () => {
      tanks.results.tanks.push({
        id: '04efab49-cbb3-4741-9b15-f0774f52118b',
        name: 'Final Tank',
        isSystem: false,
        material: TankMaterial.Steel,
        volume: 12.5,
        workingPressure: 240,
      });
      tanks.results.totalCount = 10;
      const wrapper = mount(ProfileTanksView, opts);
      expect(wrapper.find('#tanks-list-add').exists()).toBe(false);
    });
  });
});
