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
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useTanks, useToasts } from '../../../src/store';
import ProfileTankView from '../../../src/views/profile-tank-view.vue';
import { createHttpError } from '../../fixtures/create-http-error';
import { createRouter } from '../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

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

  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let tanks: ReturnType<typeof useTanks>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof ProfileTankView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/profile/:username/tanks/:tankId',
        component: ProfileTankView,
      },
    ]);
  });

  beforeEach(async () => {
    location = new MockLocation();
    location.assign(DefaultUrl);

    await router.push(DefaultUrl);

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    tanks = useTanks(pinia);
    toasts = useToasts(pinia);
    currentUser.user = BasicUser;
    tanks.currentTank = TestData;

    opts = {
      global: {
        plugins: [router, pinia],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
        stubs: { teleport: true },
      },
    };
  });

  describe('when prefetching on the server side', () => {
    it('will render the form correctly for the profile owner', async () => {
      const spy = jest
        .spyOn(client.tanks, 'getTank')
        .mockResolvedValue(new Tank(fetcher, TestData));
      const raw = await renderToString(ProfileTankView, {
        global: opts.global,
      });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(html.querySelector<HTMLInputElement>('#name')?.value).toBe(
        TestData.name,
      );
      expect(
        html.querySelector<HTMLInputElement>('#material-al')?.checked,
      ).toBe(true);
      expect(html.querySelector<HTMLInputElement>('#volume')?.value).toBe(
        TestData.volume.toString(),
      );
      expect(html.querySelector<HTMLInputElement>('#pressure')?.value).toBe(
        TestData.workingPressure.toString(),
      );

      expect(spy).toHaveBeenCalledWith(TestData.id, BasicUser.username);
    });

    it('will render the form correctly for an admin', async () => {
      const spy = jest
        .spyOn(client.tanks, 'getTank')
        .mockResolvedValue(new Tank(fetcher, TestData));
      currentUser.user = AdminUser;
      const raw = await renderToString(ProfileTankView, {
        global: opts.global,
      });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(html.querySelector<HTMLInputElement>('#name')?.value).toBe(
        TestData.name,
      );
      expect(
        html.querySelector<HTMLInputElement>('#material-al')?.checked,
      ).toBe(true);
      expect(html.querySelector<HTMLInputElement>('#volume')?.value).toBe(
        TestData.volume.toString(),
      );
      expect(html.querySelector<HTMLInputElement>('#pressure')?.value).toBe(
        TestData.workingPressure.toString(),
      );

      expect(spy).toHaveBeenCalledWith(TestData.id, BasicUser.username);
    });

    it('will show the login form if the user is not authenticated', async () => {
      currentUser.user = null;
      jest
        .spyOn(client.tanks, 'getTank')
        .mockRejectedValue(createHttpError(401));
      const raw = await renderToString(ProfileTankView, {
        global: opts.global,
      });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(html.querySelector('[data-testid="login-form"]')).not.toBeNull();
      expect(html.querySelector('#name')).toBeNull();
    });

    it("will show a forbidden message if the current user is not authorized to edit the target user's profile", async () => {
      currentUser.user = UserWithFullProfile;
      jest
        .spyOn(client.tanks, 'getTank')
        .mockRejectedValue(createHttpError(403));
      const raw = await renderToString(ProfileTankView, {
        global: opts.global,
      });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(
        html.querySelector('[data-testid="forbidden-message"]'),
      ).not.toBeNull();
      expect(html.querySelector('#name')).toBeNull();
    });

    it('will show a not found message if the tank does not exist', async () => {
      jest
        .spyOn(client.tanks, 'getTank')
        .mockRejectedValue(createHttpError(404));
      const raw = await renderToString(ProfileTankView, {
        global: opts.global,
      });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(
        html.querySelector('[data-testid="not-found-message"]'),
      ).not.toBeNull();
      expect(html.querySelector('#name')).toBeNull();
    });
  });

  describe('when navigating on the client side', () => {
    it('will show the login form if the user is not authenticated', async () => {
      currentUser.user = null;
      const wrapper = mount(ProfileTankView, opts);
      expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
      expect(wrapper.find('#name').exists()).toBe(false);
    });

    it("will show a forbidden message if the current user is not authorized to edit the target user's profile", async () => {
      currentUser.user = UserWithFullProfile;
      const wrapper = mount(ProfileTankView, opts);
      expect(wrapper.find('[data-testid="forbidden-message"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('#name').exists()).toBe(false);
    });

    it('will show a not found message if the tank does not exist', async () => {
      tanks.currentTank = null;
      const wrapper = mount(ProfileTankView, opts);
      expect(wrapper.find('[data-testid="not-found-message"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('#name').exists()).toBe(false);
    });

    it('will allow a user to update a tank', async () => {
      const expected: TankDTO = {
        ...TestData,
        name: 'Updated Tank',
        volume: 9.78,
        workingPressure: 180,
        material: TankMaterial.Steel,
      };
      const tank = new Tank(fetcher, expected);
      jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((actual) => {
        expect(actual).toEqual(expected);
        return tank;
      });
      const spy = jest.spyOn(tank, 'save').mockResolvedValue();

      const wrapper = mount(ProfileTankView, opts);

      await wrapper.get('#name').setValue(expected.name);
      await wrapper.get('#volume').setValue(expected.volume.toString());
      await wrapper
        .get('#pressure')
        .setValue(expected.workingPressure.toString());
      await wrapper.get('#material-fe').setValue(true);
      await wrapper.get('#save-tank').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('tank-saved');
    });

    it('will allow a user to delete a tank', async () => {
      const tank = new Tank(fetcher, TestData);
      jest.spyOn(client.tanks, 'wrapDTO').mockReturnValue(tank);
      const spy = jest.spyOn(tank, 'delete').mockResolvedValue();

      const wrapper = mount(ProfileTankView, opts);

      await wrapper.get('#delete-tank').trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(location.pathname).toBe(`/profile/${BasicUser.username}/tanks`);
    });

    it('will allow a user to change their mind about deleting a tank', async () => {
      const spy = jest.spyOn(client.tanks, 'wrapDTO');
      const wrapper = mount(ProfileTankView, opts);

      await wrapper.get('#delete-tank').trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(
        wrapper.find('[data-testid="dialog-cancel-button"]').exists(),
      ).toBe(false);
      expect(location.pathname).toBe(DefaultUrl);
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
      const tank = new Tank(fetcher, expected);
      jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((actual) => {
        expect(actual).toEqual(expected);
        return tank;
      });
      const spy = jest.spyOn(tank, 'save').mockResolvedValue();

      const wrapper = mount(ProfileTankView, opts);

      await wrapper.get('#name').setValue(expected.name);
      await wrapper.get('#volume').setValue(expected.volume.toString());
      await wrapper
        .get('#pressure')
        .setValue(expected.workingPressure.toString());
      await wrapper.get('#material-fe').setValue(true);
      await wrapper.get('#save-tank').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(1);
      expect(toasts.toasts[0].id).toBe('tank-saved');
    });

    it('will not submit a save request if validation fails', async () => {
      const spy = jest.spyOn(client.tanks, 'wrapDTO');

      const wrapper = mount(ProfileTankView, opts);

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
      const tank = new Tank(fetcher, TestData);
      jest.spyOn(client.tanks, 'wrapDTO').mockReturnValue(tank);
      const spy = jest.spyOn(tank, 'delete').mockResolvedValue();

      const wrapper = mount(ProfileTankView, opts);

      await wrapper.get('#delete-tank').trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(location.pathname).toBe(`/profile/${BasicUser.username}/tanks`);
    });
  });
});
