import {
  ApiClient,
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  Fetcher,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  LogEntry,
  LogEntryDTO,
  PressureUnit,
  TankMaterial,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import FormDatePicker from '../../../src/components/common/form-date-picker.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useProfiles, useTanks } from '../../../src/store';
import NewLogEntryView from '../../../src/views/new-log-entry-view.vue';
import { createHttpError } from '../../fixtures/create-http-error';
import { createRouter } from '../../fixtures/create-router';
import TestTankData from '../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

const LogNumberInput = '#logNumber';
const EntryTimezoneInput = '#entryTimeTimezone';
const TimezoneSelect = '#entryTimeTimezone';
const DurationInput = '#duration';
const BottomTimeInput = '#bottomTime';
const MaxDepthInput = '#maxDepth';
const NotesInput = '#notes';
const SaveButton = '#btnSave';

const Timezone = 'Pacific/Guam';
const LogNumber = 43;

dayjs.extend(tz);

describe('NewLogEntry view', () => {
  let router: Router;
  let fetcher: Fetcher;
  let client: ApiClient;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let profiles: ReturnType<typeof useProfiles>;
  let tanksStore: ReturnType<typeof useTanks>;
  let location: MockLocation;
  let tankData: ListTanksResponseDTO;
  let opts: ComponentMountingOptions<typeof NewLogEntryView>;

  beforeAll(() => {
    router = createRouter([
      {
        path: '/logbook/:username/new',
        name: 'new-log-entry',
        component: NewLogEntryView,
      },
    ]);
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    tankData = ListTanksResponseSchema.parse(TestTankData);
  });

  beforeEach(async () => {
    location = new MockLocation();

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    profiles = useProfiles(pinia);
    tanksStore = useTanks(pinia);
    currentUser.user = BasicUser;

    jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValue(LogNumber);
    jest.spyOn(dayjs.tz, 'guess').mockReturnValue(Timezone);

    await router.push(`/logbook/${BasicUser.username}/new`);

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

  describe('when rendering on the server side', () => {
    beforeEach(() => {
      jest.spyOn(client.tanks, 'listTanks').mockResolvedValue({
        tanks: [],
        totalCount: 0,
      });
    });

    it('will render "not found" message if requested logbook does not exist', async () => {
      currentUser.user = AdminUser;
      jest.spyOn(client.users, 'getProfile').mockRejectedValue(
        createHttpError({
          message: 'No such user',
          method: 'GET',
          path: '/api/users/unknown-user',
          status: 404,
        }),
      );

      const div = document.createElement('div');
      div.innerHTML = await renderToString(NewLogEntryView, {
        global: opts.global,
      });

      expect(div.querySelector('#logNumber')).toBeNull();
      expect(
        div.querySelector('[data-testid="not-found-message"]'),
      ).not.toBeNull();
    });

    it('will render login form if user is not authenticated', async () => {
      currentUser.user = null;
      const spy = jest.spyOn(client.users, 'getProfile').mockRejectedValue(
        createHttpError({
          message: 'Not logged in',
          method: 'GET',
          path: '/api/users/unknown-user',
          status: 401,
        }),
      );

      const div = document.createElement('div');
      div.innerHTML = await renderToString(NewLogEntryView, {
        global: opts.global,
      });

      expect(spy).not.toHaveBeenCalled();
      expect(div.querySelector('#logNumber')).toBeNull();
      expect(div.querySelector('[data-testid="login-form"]')).not.toBeNull();
    });

    it('will render forbidden message if user attempts to create a new log entry for another user', async () => {
      jest
        .spyOn(client.users, 'getProfile')
        .mockResolvedValue(UserWithFullProfile.profile);
      await router.push(`/logbook/${UserWithFullProfile.username}/new`);

      const div = document.createElement('div');
      div.innerHTML = await renderToString(NewLogEntryView, {
        global: opts.global,
      });

      expect(div.querySelector('#logNumber')).toBeNull();
      expect(
        div.querySelector('[data-testid="forbidden-message"]'),
      ).not.toBeNull();
    });

    it('will render the form if auth checks pass', async () => {
      jest
        .spyOn(client.users, 'getProfile')
        .mockResolvedValue(BasicUser.profile);
      const div = document.createElement('div');
      div.innerHTML = await renderToString(NewLogEntryView, {
        global: opts.global,
      });
      expect(div.querySelector<HTMLInputElement>('#logNumber')).not.toBeNull();
    });
  });

  describe('when rendering on the client side', () => {
    beforeEach(() => {
      profiles.currentProfile = BasicUser.profile;
      tanksStore.results = tankData;
    });

    it('will render "not found" message if requested logbook does not exist', async () => {
      await router.push('/logbook/unknown-user/new');
      profiles.currentProfile = null;
      currentUser.user = AdminUser;
      const wrapper = mount(NewLogEntryView, opts);
      await flushPromises();
      expect(
        wrapper.find('[data-testid="not-found-message"]').isVisible(),
      ).toBe(true);
      expect(wrapper.find(LogNumberInput).exists()).toBe(false);
    });

    it('will render login form if user is not authenticated', async () => {
      currentUser.user = null;
      const wrapper = mount(NewLogEntryView, opts);
      expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    });

    it('will render forbidden message if user attempts to create a new log entry for another user', async () => {
      await router.push('/logbook/another-user/new');
      const wrapper = mount(NewLogEntryView, opts);
      await flushPromises();
      expect(
        wrapper.find('[data-testid="forbidden-message"]').isVisible(),
      ).toBe(true);
    });

    it('will render an empty form', async () => {
      const wrapper = mount(NewLogEntryView, opts);
      await flushPromises();

      expect(wrapper.find<HTMLInputElement>(LogNumberInput).element.value).toBe(
        LogNumber.toString(),
      );
      expect(
        wrapper.getComponent(FormDatePicker).props().modelValue,
      ).toBeUndefined();
      expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
        Timezone,
      );
      expect(wrapper.get<HTMLInputElement>(DurationInput).element.value).toBe(
        '',
      );
      expect(wrapper.get<HTMLInputElement>(BottomTimeInput).element.value).toBe(
        '',
      );
      expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe(
        '',
      );
      expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe(
        '',
      );
    });

    it('will save a valid entry and redirect to the entry page', async () => {
      const logNumber = 88;
      const entryTime = new Date('2024-05-07T14:41:06');
      const timezone = 'America/Vancouver';
      const duration = 44.1;
      const bottomTime = 41.8;
      const maxDepth = 33.3;
      const notes = 'hello';

      const options: CreateOrUpdateLogEntryParamsDTO = {
        timing: {
          duration,
          entryTime: {
            date: '2024-05-07T14:41:06',
            timezone,
          },
          bottomTime,
        },
        logNumber,
        depths: {
          maxDepth,
          depthUnit: DepthUnit.Meters,
        },
        notes,
      };
      const expected: LogEntryDTO = {
        ...options,
        id: 'df9d71d7-5847-436a-97c9-1ea97d3f2c7d',
        creator: BasicUser.profile,
        createdAt: new Date('2024-07-23T12:52:10Z'),
        site: undefined,
      };

      const spy = jest
        .spyOn(client.logEntries, 'createLogEntry')
        .mockResolvedValue(new LogEntry(fetcher, expected));
      const wrapper = mount(NewLogEntryView, opts);
      await flushPromises();

      await wrapper.get(LogNumberInput).setValue(logNumber.toString());
      await wrapper.getComponent(FormDatePicker).setValue(entryTime);
      await wrapper.get(TimezoneSelect).setValue(timezone);
      await wrapper.get(DurationInput).setValue(duration.toString());
      await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
      await wrapper.get(MaxDepthInput).setValue(maxDepth);
      await wrapper.get(NotesInput).setValue(notes);
      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0]).toMatchSnapshot();
      expect(location.pathname).toBe(
        `/logbook/${BasicUser.username}/${expected.id}`,
      );
    });

    it('will allow admins to create new entries on behalf of other users', async () => {
      currentUser.user = AdminUser;
      const logNumber = 88;
      const entryTime = new Date('2024-05-07T14:41:06');
      const timezone = 'America/Vancouver';
      const duration = 44.1;
      const bottomTime = 41.8;
      const maxDepth = 33.3;
      const notes = 'hello';

      const options: CreateOrUpdateLogEntryParamsDTO = {
        timing: {
          duration,
          entryTime: {
            date: '2024-05-07T14:41:06',
            timezone,
          },
          bottomTime,
        },
        logNumber,
        depths: {
          maxDepth,
          depthUnit: DepthUnit.Meters,
        },
        notes,
      };
      const expected: LogEntryDTO = {
        ...options,
        id: 'df9d71d7-5847-436a-97c9-1ea97d3f2c7d',
        creator: BasicUser.profile,
        createdAt: new Date('2024-07-23T12:52:10Z'),
        site: undefined,
      };

      const spy = jest
        .spyOn(client.logEntries, 'createLogEntry')
        .mockResolvedValue(new LogEntry(fetcher, expected));
      const wrapper = mount(NewLogEntryView, opts);
      await flushPromises();

      await wrapper.get(LogNumberInput).setValue(logNumber.toString());
      await wrapper.getComponent(FormDatePicker).setValue(entryTime);
      await wrapper.get(TimezoneSelect).setValue(timezone);
      await wrapper.get(DurationInput).setValue(duration.toString());
      await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
      await wrapper.get(MaxDepthInput).setValue(maxDepth);
      await wrapper.get(NotesInput).setValue(notes);
      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0]).toMatchSnapshot();
      expect(location.pathname).toBe(
        `/logbook/${BasicUser.username}/${expected.id}`,
      );
    });

    it('will allow users to save information on breathing gas', async () => {
      currentUser.user = BasicUser;

      const expected: LogEntryDTO = {
        creator: BasicUser.profile,
        createdAt: new Date('2024-07-23T12:52:10Z'),
        timing: {
          entryTime: {
            date: '2021-01-01T12:00:00',
            timezone: 'America/Los_Angeles',
          },
          duration: 66,
        },
        id: '1f3c6568-d63c-4e52-8679-2a85d6f6b1f4',
        air: [
          {
            count: 2,
            endPressure: 50,
            hePercent: 40,
            material: TankMaterial.Aluminum,
            name: 'AL13 (CCR 2L): Aluminum XS-13',
            o2Percent: 21,
            pressureUnit: PressureUnit.Bar,
            startPressure: 207,
            volume: 1.8,
            workingPressure: 207,
          },
        ],
        logNumber: 13,
        notes: 'New notes',
      };
      const air = {
        startPressure: 207,
        count: 2,
        endPressure: 50,
        o2Percent: 21,
        hePercent: 40,
        tankId: tankData.tanks[0].id,
      };

      const saveSpy = jest
        .spyOn(client.logEntries, 'createLogEntry')
        .mockResolvedValue(new LogEntry(fetcher, expected));

      await router.push(`/logbook/${BasicUser.username}/new`);

      const wrapper = mount(NewLogEntryView, opts);
      await flushPromises();

      await wrapper.get(LogNumberInput).setValue('13');
      await wrapper
        .getComponent(FormDatePicker)
        .setValue(new Date(expected.timing.entryTime.date));
      await wrapper.get(EntryTimezoneInput).setValue('America/Los_Angeles');
      await wrapper.get(DurationInput).setValue('66');
      await wrapper.get(NotesInput).setValue('New notes');

      await wrapper.get('#btn-add-tank').trigger('click');
      await wrapper
        .get('[data-testid="tanks-select"]')
        .setValue(tankData.tanks[0].id);
      await wrapper.get('[data-testid="doubles"]').setValue(true);
      await wrapper
        .get('[data-testid="start-pressure"]')
        .setValue(air.startPressure.toString());
      await wrapper
        .get('[data-testid="end-pressure"]')
        .setValue(air.endPressure.toString());
      await wrapper
        .get('[data-testid="o2"]')
        .setValue(air.o2Percent.toString());
      await wrapper
        .get('[data-testid="he"]')
        .setValue(air.hePercent.toString());

      await wrapper.get('#btnSave').trigger('click');
      await flushPromises();

      expect(saveSpy).toHaveBeenCalled();
      expect(saveSpy.mock.calls[0]).toMatchSnapshot();

      expect(location.pathname).toBe(
        `/logbook/${BasicUser.username}/${expected.id}`,
      );
    });
  });
});
