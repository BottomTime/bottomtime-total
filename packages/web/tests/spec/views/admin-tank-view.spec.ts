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
import AdminTankView from '../../../src/views/admin-tank-view.vue';
import { createHttpError } from '../../fixtures/create-http-error';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

const TestData: TankDTO = {
  id: '776c6a29-faf0-4577-9092-90fcf8e5c9c4',
  name: 'Test Tank',
  volume: 12,
  workingPressure: 232,
  material: TankMaterial.Steel,
  isSystem: true,
};

describe('Admin Tank View', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let location: MockLocation;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let tanks: ReturnType<typeof useTanks>;
  let toasts: ReturnType<typeof useToasts>;
  let opts: ComponentMountingOptions<typeof AdminTankView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/admin/tanks/:tankId',
        component: AdminTankView,
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    tanks = useTanks(pinia);
    toasts = useToasts(pinia);

    currentUser.user = AdminUser;
    tanks.currentTank = TestData;

    location = new MockLocation();

    await router.push(`/admin/tanks/${TestData.id}`);

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
    it('will retrieve the tank profile and render the form correctly', async () => {
      const spy = jest
        .spyOn(client.tanks, 'getTank')
        .mockResolvedValue(new Tank(fetcher, TestData));

      const raw = await renderToString(AdminTankView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalledWith(TestData.id);
      expect(html.querySelector<HTMLInputElement>('#name')?.value).toBe(
        TestData.name,
      );
      expect(html.querySelector<HTMLInputElement>('#volume')?.value).toBe(
        TestData.volume.toString(),
      );
      expect(html.querySelector<HTMLInputElement>('#pressure')?.value).toBe(
        TestData.workingPressure.toString(),
      );
      expect(
        html.querySelector<HTMLInputElement>('#material-fe')?.checked,
      ).toBe(true);
    });

    it('will show a not found message if the tank does not exist', async () => {
      const spy = jest
        .spyOn(client.tanks, 'getTank')
        .mockRejectedValue(createHttpError(404));

      const raw = await renderToString(AdminTankView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalledWith(TestData.id);
      expect(
        html.querySelector<HTMLParagraphElement>(
          '[data-testid="not-found-message"]',
        ),
      ).toBeDefined();
      expect(html.querySelector('#name')).toBeNull();
    });

    it('will show login form if user is not authenticated', async () => {
      const spy = jest
        .spyOn(client.tanks, 'getTank')
        .mockRejectedValue(createHttpError(401));
      currentUser.user = null;

      const raw = await renderToString(AdminTankView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalled();
      expect(html.querySelector('[data-testid="login-form"]')).toBeDefined();
      expect(html.querySelector('#name')).toBeNull();
    });

    it('will show forbidden message if user is not an admin', async () => {
      const spy = jest
        .spyOn(client.tanks, 'getTank')
        .mockRejectedValue(createHttpError(403));
      currentUser.user = BasicUser;

      const raw = await renderToString(AdminTankView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalled();
      expect(
        html.querySelector('[data-testid="forbidden-message"]'),
      ).toBeDefined();
      expect(html.querySelector('#name')).toBeNull();
    });
  });

  describe('when rendering on the client side', () => {
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

      await wrapper.get('#name').setValue(expected.name);
      await wrapper.get('#volume').setValue(expected.volume.toString());
      await wrapper
        .get('#pressure')
        .setValue(expected.workingPressure.toString());
      await wrapper.get('#material-al').setValue(true);
      await wrapper.get('#save-tank').trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(toasts.toasts[0].message).toMatchSnapshot();
    });

    it('will prevent users form saving tanks if there are validation errors', async () => {
      const spy = jest.spyOn(client.tanks, 'wrapDTO');

      const wrapper = mount(AdminTankView, opts);

      await wrapper.get('#volume').setValue('nope');
      await wrapper.get('#save-tank').trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(toasts.toasts).toHaveLength(0);
      expect(
        wrapper.find('[data-testid="volume-error"]').text(),
      ).toMatchSnapshot();
    });

    it('will show a not found message if the tank does not exist', async () => {
      tanks.currentTank = null;
      const wrapper = mount(AdminTankView, opts);
      expect(
        wrapper.find('[data-testid="not-found-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.find('#name').exists()).toBe(false);
    });

    it('will show login form if user is not authenticated', async () => {
      currentUser.user = null;
      const wrapper = mount(AdminTankView, opts);
      expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
      expect(wrapper.find('#name').exists()).toBe(false);
    });

    it('will show forbidden message if user is not an admin', async () => {
      currentUser.user = BasicUser;
      const wrapper = mount(AdminTankView, opts);
      expect(
        wrapper.find('[data-testid="forbidden-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.find('#name').exists()).toBe(false);
    });
  });
});
