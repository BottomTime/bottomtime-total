import {
  ApiClient,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  TankDTO,
  TankMaterial,
  TankSchema,
} from '@bottomtime/api';
import { Tank } from '@bottomtime/api/src/client/tank';

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
import AdminTanksView from '../../../src/views/admin-tanks-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import TestTankData from '../../fixtures/tanks.json';
import { AdminUser, BasicUser } from '../../fixtures/users';

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
  let client: ApiClient;
  let router: Router;
  let tankData: ListTanksResponseDTO;

  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let tanksStore: ReturnType<typeof useTanks>;
  let opts: ComponentMountingOptions<typeof AdminTanksView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    tankData = ListTanksResponseSchema.parse(TestTankData);

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    tanksStore = useTanks(pinia);
    currentUser.user = AdminUser;
    tanksStore.results = tankData;

    location = new MockLocation();

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

  describe('when performing server prefetch', () => {
    it('will fetch the system tanks and render them', async () => {
      const spy = jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
        tanks: tankData.tanks.map((tank) => new Tank(client.axios, tank)),
        totalCount: tankData.tanks.length,
      });
      const raw = await renderToString(AdminTanksView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalledWith();
      expect(
        html.querySelector('[data-testid="tanks-list-counts"]')?.innerHTML,
      ).toMatchSnapshot();

      tankData.tanks.forEach((tank) => {
        expect(
          html.querySelector<HTMLButtonElement>(
            `[data-testid="select-tank-${tank.id}"]`,
          )?.innerHTML,
        ).toContain(tank.name);
      });
    });

    it('will render login form if user is not authenticated', async () => {
      const spy = jest
        .spyOn(client.tanks, 'listTanks')
        .mockRejectedValue(createAxiosError(401));
      currentUser.user = null;

      const raw = await renderToString(AdminTanksView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalled();
      expect(html.querySelector('[data-testid="login-form"]')).toBeDefined();
    });

    it('will render forbidden message if user is not an admin', async () => {
      const spy = jest
        .spyOn(client.tanks, 'listTanks')
        .mockRejectedValue(createAxiosError(403));
      currentUser.user = BasicUser;

      const raw = await renderToString(AdminTanksView, { global: opts.global });
      const html = document.createElement('div');
      html.innerHTML = raw;

      expect(spy).toHaveBeenCalled();
      expect(
        html.querySelector('[data-testid="forbidden-message"]'),
      ).toBeDefined();
    });
  });

  describe('when rendering on client side', () => {
    it('will render the tanks list', async () => {
      const wrapper = mount(AdminTanksView, opts);
      expect(
        wrapper.get('[data-testid="tanks-list-counts"]').text(),
      ).toMatchSnapshot();

      const items = wrapper.findAllComponents(TanksListItem);
      expect(items).toHaveLength(tankData.tanks.length);
    });

    it('will render login form if user is not authenticated', async () => {
      currentUser.user = null;

      const wrapper = mount(AdminTanksView, opts);
      expect(wrapper.get('[data-testid="login-form"]').isVisible()).toBe(true);
      expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
        false,
      );
    });

    it('will render forbidden message if user is not an admin', async () => {
      currentUser.user = BasicUser;

      const wrapper = mount(AdminTanksView, opts);
      expect(wrapper.get('[data-testid="forbidden-message"]').isVisible()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="tanks-list-counts"]').exists()).toBe(
        false,
      );
    });

    it('will allow a user to delete a tank', async () => {
      const dto = tankData.tanks[3];
      const tank = new Tank(client.axios, dto);
      const spy = jest.spyOn(tank, 'delete').mockResolvedValue();
      jest.spyOn(client.tanks, 'wrapDTO').mockReturnValue(tank);

      const wrapper = mount(AdminTanksView, opts);
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

    it('will allow a user to change their mind about deleting a tank', async () => {
      const dto = tankData.tanks[5];
      const tank = new Tank(client.axios, dto);
      const spy = jest.spyOn(tank, 'delete').mockResolvedValue();
      jest.spyOn(client.tanks, 'wrapDTO').mockReturnValue(tank);

      const wrapper = mount(AdminTanksView, opts);
      await wrapper
        .get(`[data-testid="delete-tank-${dto.id}"]`)
        .trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');
      await flushPromises();

      expect(spy).not.toHaveBeenCalled();
      expect(
        wrapper.find(`[data-testid="select-tank-${dto.id}"]`).isVisible(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="dialog-cancel-button"]').exists(),
      ).toBe(false);
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

      const spy = jest
        .spyOn(client.tanks, 'createTank')
        .mockResolvedValue(new Tank(client.axios, data));

      const wrapper = mount(AdminTanksView, opts);
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
      const dto = tankData.tanks[8];
      const expected: TankDTO = {
        ...dto,
        name,
        volume,
        workingPressure,
        material: TankMaterial.Steel,
      };
      const tank = new Tank(client.axios, expected);
      const spy = jest.spyOn(tank, 'save').mockResolvedValue();
      let savedDTO: TankDTO | undefined;

      jest.spyOn(client.tanks, 'wrapDTO').mockImplementation((dto) => {
        savedDTO = TankSchema.parse(dto);
        return tank;
      });

      const tankSelector = `[data-testid="select-tank-${dto.id}"]`;

      const wrapper = mount(AdminTanksView, opts);
      await wrapper.get(tankSelector).trigger('click');
      await wrapper.get(NameInput).setValue(name);
      await wrapper.get(VolumeInput).setValue(volume);
      await wrapper.get(PressureInput).setValue(workingPressure);
      await wrapper.get(MaterialRadio.Steel).setValue(true);
      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(wrapper.find(NameInput).exists()).toBe(false);
      expect(spy).toHaveBeenCalled();
      expect(savedDTO).toEqual(expected);

      expect(wrapper.find(tankSelector).text()).toBe(name);
    });
  });
});
