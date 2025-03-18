import {
  AccountTier,
  ApiClient,
  ApiList,
  CreateOrUpdateLogEntryParamsSchema,
  DepthUnit,
  Fetcher,
  ListTanksResponseSchema,
  LogBookSharing,
  LogEntryDTO,
  PressureUnit,
  TankDTO,
  TankMaterial,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { NavigationObserverKey } from 'src/navigation-observer';
import { MockNavigationObserver } from 'tests/mock-navigation-observer';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import DurationInput from '../../../../src/components/common/duration-input.vue';
import EditLogbookEntry from '../../../../src/components/logbook/editor/edit-logbook-entry.vue';
import ViewLogbookEntry from '../../../../src/components/logbook/view-logbook-entry.vue';
import { useCurrentUser } from '../../../../src/store';
import LogEntryView from '../../../../src/views/logbook/log-entry-view.vue';
import { createHttpError } from '../../../fixtures/create-http-error';
import { createRouter } from '../../../fixtures/create-router';
import TankTestData from '../../../fixtures/tanks.json';
import {
  AdminUser,
  BasicUser,
  UserWithEmptyProfile,
} from '../../../fixtures/users';
import StarRatingStub from '../../../stubs/star-rating-stub.vue';

const TestData: LogEntryDTO = {
  creator: {
    accountTier: AccountTier.Basic,
    logBookSharing: LogBookSharing.Public,
    username: 'logbook_guy',
    memberSince: new Date('2021-01-01T12:00').valueOf(),
    userId: 'bfb8f31f-8ac0-427e-84a5-f17111855727',
  },
  createdAt: new Date('2021-01-01T12:00').valueOf(),
  timing: {
    duration: 48.2,
    entryTime: new Date('2021-01-01T12:00:00').valueOf(),
    timezone: 'America/Los_Angeles',
    bottomTime: 44.1,
  },
  id: '1f3c6568-d63c-4e52-8679-2a85d6f6b1f4',
  logNumber: 12,
  depths: {
    maxDepth: 26.2,
    depthUnit: DepthUnit.Meters,
  },
  notes: 'Oooooo weeeeeee!!!',
};

describe('Log Entry view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let tankData: ApiList<TankDTO>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let navigationObserver: MockNavigationObserver;
  let opts: ComponentMountingOptions<typeof LogEntryView>;
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/logbook/:username/new',
        component: LogEntryView,
      },
      {
        path: '/logbook/:username/:entryId',
        component: LogEntryView,
      },
    ]);
    tankData = ListTanksResponseSchema.parse(TankTestData);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    navigationObserver = new MockNavigationObserver(router, true);

    jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValue(12);

    currentUser.user = BasicUser;
    await router.push(`/logbook/${TestData.creator.username}/${TestData.id}`);

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [NavigationObserverKey as symbol]: navigationObserver,
        },
        stubs: { teleport: true, StarRating: StarRatingStub },
      },
    };

    jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue([]);
    jest.spyOn(client.tanks, 'listTanks').mockResolvedValue(tankData);

    fetchSpy = jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockResolvedValue({ ...TestData, creator: BasicUser.profile });
  });

  it('will render in edit mode if the user owns the log entry', async () => {
    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);
    const wrapper = mount(LogEntryView, opts);
    await flushPromises();
    const editEntry = wrapper.findComponent(EditLogbookEntry);
    expect(editEntry.isVisible()).toBe(true);
    expect(editEntry.find<HTMLInputElement>('#logNumber').element.value).toBe(
      TestData.logNumber!.toString(),
    );
    expect(fetchSpy).toHaveBeenCalledWith(BasicUser.username, TestData.id);
  });

  it('will render in edit mode if the user is an admin', async () => {
    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);
    currentUser.user = AdminUser;
    const wrapper = mount(LogEntryView, opts);
    await flushPromises();

    const editEntry = wrapper.findComponent(EditLogbookEntry);
    expect(editEntry.isVisible()).toBe(true);
    expect(editEntry.find<HTMLInputElement>('#logNumber').element.value).toBe(
      TestData.logNumber!.toString(),
    );
    expect(fetchSpy).toHaveBeenCalledWith(BasicUser.username, TestData.id);
  });

  it('will render in read-only if log entry is shared with the current user', async () => {
    currentUser.user = UserWithEmptyProfile;
    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);

    const wrapper = mount(LogEntryView, opts);
    await flushPromises();

    expect(wrapper.getComponent(ViewLogbookEntry).props('entry')).toEqual({
      ...TestData,
      creator: BasicUser.profile,
    });
    expect(fetchSpy).toHaveBeenCalledWith(BasicUser.username, TestData.id);
  });

  it('will render not found message if log entry is not shared with current user', async () => {
    jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockRejectedValue(createHttpError(403));
    const wrapper = mount(LogEntryView, opts);
    await flushPromises();
    expect(wrapper.get('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
  });

  it('will render not found page if log entry does not exist', async () => {
    jest
      .spyOn(client.logEntries, 'getLogEntry')
      .mockRejectedValue(createHttpError(404));
    const wrapper = mount(LogEntryView, opts);
    await flushPromises();
    expect(wrapper.get('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
  });

  it('will allow a user to save changes to a log entry', async () => {
    const expected: LogEntryDTO = {
      ...TestData,
      air: [
        {
          count: 1,
          endPressure: 50,
          hePercent: undefined,
          material: TankMaterial.Aluminum,
          name: 'AL13 (CCR 2L): Aluminum XS-13',
          o2Percent: undefined,
          pressureUnit: PressureUnit.Bar,
          startPressure: 207,
          volume: 1.8,
          workingPressure: 207,
        },
      ],
      creator: BasicUser.profile,
      conditions: {
        temperatureUnit: TemperatureUnit.Celsius,
        weather: '',
      },
      equipment: {
        weightUnit: WeightUnit.Kilograms,
      },
      logNumber: 13,
      timing: {
        ...TestData.timing,
        duration: 66,
      },
      notes: 'New notes',
    };
    const saveSpy = jest
      .spyOn(client.logEntries, 'updateLogEntry')
      .mockResolvedValue(expected);

    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);

    const wrapper = mount(LogEntryView, opts);
    await flushPromises();

    await wrapper.get('#logNumber').setValue('13');
    await wrapper.getComponent(DurationInput).setValue(66);
    await wrapper.get('#notes').setValue('New notes');
    await wrapper.get('#tanks-select-0').setValue(tankData.data[0].id);
    await wrapper.get('#start-pressure-0').setValue('207');
    await wrapper.get('#end-pressure-0').setValue('50');
    await wrapper.get('#btnSave').trigger('click');
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(
      BasicUser.username,
      TestData.id,
      CreateOrUpdateLogEntryParamsSchema.parse(expected),
    );
    expect(wrapper.find<HTMLInputElement>('#logNumber').element.value).toBe(
      '13',
    );
    expect(wrapper.getComponent(DurationInput).props('modelValue')).toBe(66);
    expect(wrapper.find<HTMLTextAreaElement>('#notes').element.value).toBe(
      'New notes',
    );
  });

  it('will allow users to save information on breathing gas', async () => {
    const expected: LogEntryDTO = {
      ...TestData,
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
      creator: BasicUser.profile,
      conditions: {
        temperatureUnit: TemperatureUnit.Celsius,
        weather: '',
      },
      equipment: {
        weightUnit: WeightUnit.Kilograms,
      },
      logNumber: 13,
      timing: {
        ...TestData.timing,
        duration: 66,
      },
      notes: 'New notes',
    };
    const air = {
      startPressure: 207,
      count: 2,
      endPressure: 50,
      o2Percent: 21,
      hePercent: 40,
      tankId: tankData.data[0].id,
    };
    const saveSpy = jest
      .spyOn(client.logEntries, 'updateLogEntry')
      .mockResolvedValue(expected);

    await router.push(`/logbook/${BasicUser.username}/${TestData.id}`);

    const wrapper = mount(LogEntryView, opts);
    await flushPromises();

    await wrapper.get('#logNumber').setValue('13');
    await wrapper.getComponent(DurationInput).setValue(66);
    await wrapper.get('#notes').setValue('New notes');

    await wrapper
      .get('[data-testid="tanks-select-0"]')
      .setValue(tankData.data[0].id);
    await wrapper.get('[data-testid="doubles"]').setValue(true);
    await wrapper
      .get('[data-testid="start-pressure-0"]')
      .setValue(air.startPressure.toString());
    await wrapper
      .get('[data-testid="end-pressure-0"]')
      .setValue(air.endPressure.toString());
    await wrapper
      .get('[data-testid="o2-0"]')
      .setValue(air.o2Percent.toString());
    await wrapper
      .get('[data-testid="he-0"]')
      .setValue(air.hePercent.toString());

    await wrapper.get('#btnSave').trigger('click');
    await flushPromises();

    expect(saveSpy).toHaveBeenCalledWith(
      BasicUser.username,
      TestData.id,
      CreateOrUpdateLogEntryParamsSchema.parse(expected),
    );
  });
});
