import {
  ApiClient,
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  LogEntry,
  LogEntryDTO,
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
import { AppInitialState, useInitialState } from '../../../src/initial-state';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import NewLogEntryView from '../../../src/views/new-log-entry-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import {
  AdminUser,
  BasicUser,
  UserWithFullProfile,
} from '../../fixtures/users';

const LogNumberInput = '#logNumber';
const TimezoneSelect = '#entryTimeTimezone';
const DurationInput = '#duration';
const BottomTimeInput = '#bottomTime';
const MaxDepthInput = '#maxDepth';
const NotesInput = '#notes';
const SaveButton = '#btnSave';

const Timezone = 'Pacific/Guam';
const LogNumber = 43;

dayjs.extend(tz);
jest.mock('../../../src/initial-state');

describe('NewLogEntry view', () => {
  let router: Router;
  let client: ApiClient;

  let pinia: Pinia;
  let initialState: AppInitialState;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let location: MockLocation;
  let opts: ComponentMountingOptions<typeof NewLogEntryView>;

  beforeAll(() => {
    router = createRouter([
      {
        path: '/logbook/:username/new',
        name: 'new-log-entry',
        component: NewLogEntryView,
      },
    ]);
    client = new ApiClient();
  });

  beforeEach(async () => {
    location = new MockLocation();

    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    initialState = {
      currentUser: BasicUser,
      currentProfile: BasicUser.profile,
    };

    jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValue(LogNumber);
    jest.spyOn(dayjs.tz, 'guess').mockReturnValue(Timezone);
    jest.mocked(useInitialState).mockImplementation(() => initialState);

    await router.push(`/logbook/${BasicUser.username}/new`);

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

  describe('when rendering on the server side', () => {
    it('will render "not found" message if requested logbook does not exist', async () => {
      currentUser.user = AdminUser;
      jest.spyOn(client.users, 'getProfile').mockRejectedValue(
        createAxiosError({
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
        createAxiosError({
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
    it('will render "not found" message if requested logbook does not exist', async () => {
      await router.push('/logbook/unknown-user/new');
      initialState.currentProfile = undefined;
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
        duration,
        entryTime: {
          date: '2024-05-07T14:41:06',
          timezone,
        },
        bottomTime,
        logNumber,
        maxDepth: { depth: maxDepth, unit: DepthUnit.Meters },
        notes,
      };
      const expected: LogEntryDTO = {
        ...options,
        id: 'df9d71d7-5847-436a-97c9-1ea97d3f2c7d',
        creator: BasicUser.profile,
      };

      const spy = jest
        .spyOn(client.logEntries, 'createLogEntry')
        .mockResolvedValue(new LogEntry(client.axios, expected));
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

      expect(spy).toHaveBeenCalledWith(BasicUser.username, {
        ...expected,
        id: '',
      });
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
        duration,
        entryTime: {
          date: '2024-05-07T14:41:06',
          timezone,
        },
        bottomTime,
        logNumber,
        maxDepth: { depth: maxDepth, unit: DepthUnit.Meters },
        notes,
      };
      const expected: LogEntryDTO = {
        ...options,
        id: 'df9d71d7-5847-436a-97c9-1ea97d3f2c7d',
        creator: BasicUser.profile,
      };

      const spy = jest
        .spyOn(client.logEntries, 'createLogEntry')
        .mockResolvedValue(new LogEntry(client.axios, expected));
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

      expect(spy).toHaveBeenCalledWith(BasicUser.username, {
        ...expected,
        id: '',
      });
      expect(location.pathname).toBe(
        `/logbook/${BasicUser.username}/${expected.id}`,
      );
    });
  });
});
