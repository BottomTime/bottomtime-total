import { ApiClient, DepthUnit } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import EditBasicInfo from '../../../../../src/components/logbook/editor/edit-basic-info.vue';
import { LogEntryBasicInfo } from '../../../../../src/components/logbook/editor/types';
import { useCurrentUser } from '../../../../../src/store';
import { BasicUser } from '../../../..//fixtures/users';
import { createRouter } from '../../../../fixtures/create-router';

const TestData: LogEntryBasicInfo = {
  avgDepth: 34,
  bottomTime: 2799,
  depthUnit: DepthUnit.Feet,
  duration: 3814,
  entryTimezone: 'America/Los_Angeles',
  logNumber: 1234,
  maxDepth: 56,
  surfaceInterval: 1234,
  tags: ['tag1', 'tag2'],
  entryTime: new Date('2025-01-16T11:22:27-04:00'),
};
const BlankData: LogEntryBasicInfo = {
  avgDepth: '',
  bottomTime: '',
  depthUnit: DepthUnit.Meters,
  duration: '',
  entryTimezone: '',
  logNumber: '',
  maxDepth: '',
  surfaceInterval: '',
  tags: [],
};

enum DurationInput {
  Hours = '#duration-hours',
  Minutes = '#duration-minutes',
  Seconds = '#duration-seconds',
}
enum BottomTimeInput {
  Hours = '#bottomTime-hours',
  Minutes = '#bottomTime-minutes',
  Seconds = '#bottomTime-seconds',
}
enum SurfaceIntervalInput {
  Hours = '#surfaceInterval-hours',
  Minutes = '#surfaceInterval-minutes',
  Seconds = '#surfaceInterval-seconds',
}
const LogNumberInput = '#logNumber';
const EntryTimeInput = '#dp-input-entryTime';
const TimezoneSelect = '#entryTimeTimezone';
const MaxDepthInput = '#maxDepth';
const AvgDepthInput = '#avgDepth';
const DepthUnitButton = '#maxDepth-unit';

describe('EditBasicInfo component', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;

  function getOpts(
    value: LogEntryBasicInfo,
  ): ComponentMountingOptions<typeof EditBasicInfo> {
    return {
      props: {
        modelValue: { ...value },
      },
      global: {
        provide: {
          [ApiClientKey as symbol]: client,
        },
        plugins: [pinia, router],
      },
    };
  }

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/logbook/:username',
        component: { template: '<div></div>' },
      },
      {
        path: '/logbook/:username/:entryId',
        component: { template: '<div></div>' },
      },
    ]);
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    await router.push(`/logbook/${BasicUser.username}`);
  });

  it('will render correctly with values set', async () => {
    const wrapper = mount(EditBasicInfo, getOpts(TestData));
    await flushPromises();
    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      TestData.logNumber.toString(),
    );

    expect(wrapper.get<HTMLInputElement>(EntryTimeInput).element.value).toBe(
      '2025-Jan-16 07:22:27 AM',
    );
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      TestData.entryTimezone,
    );

    expect(
      wrapper.get<HTMLInputElement>(DurationInput.Hours).element.value,
    ).toBe('01');
    expect(
      wrapper.get<HTMLInputElement>(DurationInput.Minutes).element.value,
    ).toBe('03');
    expect(
      wrapper.get<HTMLInputElement>(DurationInput.Seconds).element.value,
    ).toBe('34.00');

    expect(
      wrapper.get<HTMLInputElement>(BottomTimeInput.Hours).element.value,
    ).toBe('00');
    expect(
      wrapper.get<HTMLInputElement>(BottomTimeInput.Minutes).element.value,
    ).toBe('46');
    expect(
      wrapper.get<HTMLInputElement>(BottomTimeInput.Seconds).element.value,
    ).toBe('39.00');

    expect(
      wrapper.get<HTMLInputElement>(SurfaceIntervalInput.Hours).element.value,
    ).toBe('00');
    expect(
      wrapper.get<HTMLInputElement>(SurfaceIntervalInput.Minutes).element.value,
    ).toBe('20');
    expect(
      wrapper.get<HTMLInputElement>(SurfaceIntervalInput.Seconds).element.value,
    ).toBe('34.00');

    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe(
      TestData.maxDepth.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(AvgDepthInput).element.value).toBe(
      TestData.avgDepth.toString(),
    );
    expect(wrapper.get(DepthUnitButton).text()).toBe('ft');
  });

  it('will render a blank form with no values set', async () => {
    const logNumber = 666;
    jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValue(logNumber);
    const wrapper = mount(EditBasicInfo, getOpts(BlankData));
    await flushPromises();
    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      logNumber.toString(),
    );
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      '',
    );

    expect(
      wrapper.get<HTMLInputElement>(DurationInput.Hours).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(DurationInput.Minutes).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(DurationInput.Seconds).element.value,
    ).toBe('');

    expect(
      wrapper.get<HTMLInputElement>(BottomTimeInput.Hours).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(BottomTimeInput.Minutes).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(BottomTimeInput.Seconds).element.value,
    ).toBe('');

    expect(
      wrapper.get<HTMLInputElement>(SurfaceIntervalInput.Hours).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(SurfaceIntervalInput.Minutes).element.value,
    ).toBe('');
    expect(
      wrapper.get<HTMLInputElement>(SurfaceIntervalInput.Seconds).element.value,
    ).toBe('');

    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(AvgDepthInput).element.value).toBe('');
    expect(wrapper.get(DepthUnitButton).text()).toBe('m');
  });
});
