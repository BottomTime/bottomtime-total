import {
  ApiClient,
  LogEntryDTO,
  PressureUnit,
  TankDTO,
  TankSchema,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { NavigationObserverKey } from 'src/navigation-observer';
import { ConfirmDialog } from 'tests/constants';
import 'tests/dayjs';
import { MockNavigationObserver } from 'tests/mock-navigation-observer';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import EditEntryAir from '../../../../../src/components/logbook/editor/edit-entry-air.vue';
import EditLogbookEntry from '../../../../../src/components/logbook/editor/edit-logbook-entry.vue';
import { useCurrentUser } from '../../../../../src/store';
import { createRouter } from '../../../../fixtures/create-router';
import {
  FullLogEntry,
  MinimalLogEntry,
} from '../../../../fixtures/log-entries';
import TankData from '../../../../fixtures/tanks.json';
import { BasicUser } from '../../../../fixtures/users';
import StarRatingStub from '../../../../stubs/star-rating-stub.vue';

const AddTankButton = '#btn-add-tank';
const SaveButton = '#btnSave';

function tankSelect(ordinal: number) {
  return `[data-testid="tanks-select-${ordinal}"]`;
}

function startPressure(ordinal: number) {
  return `[data-testid="start-pressure-${ordinal}"]`;
}

function endPressure(ordinal: number) {
  return `[data-testid="end-pressure-${ordinal}"]`;
}

function o2Percent(ordinal: number) {
  return `[data-testid="o2-${ordinal}"]`;
}

function hePercent(ordinal: number) {
  return `[data-testid="he-${ordinal}"]`;
}

function pressureUnitToggle(ordinal: number) {
  return `[data-testid="start-pressure-${ordinal}-unit"]`;
}

function tankSelectError(ordinal: number) {
  return `[data-testid="tanks-select-${ordinal}-error"]`;
}

function startPressureError(ordinal: number) {
  return `[data-testid="start-pressure-${ordinal}-error"]`;
}

function endPressureError(ordinal: number) {
  return `[data-testid="end-pressure-${ordinal}-error"]`;
}

function o2PercentError(ordinal: number) {
  return `[data-testid="o2-${ordinal}-error"]`;
}

function hePercentError(ordinal: number) {
  return `[data-testid="he-${ordinal}-error"]`;
}

function removeTankButton(ordinal: number) {
  return `[data-testid="remove-tank-${ordinal}"]`;
}

describe('Log entry editor - air management', () => {
  let client: ApiClient;
  let router: Router;
  let tanks: TankDTO[];

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let navigationObserver: MockNavigationObserver;
  let opts: ComponentMountingOptions<typeof EditLogbookEntry>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/logbook/:username/:entryId',
        component: { template: '<div></div>' },
      },
    ]);
    tanks = TankSchema.array().parse(TankData.data);
  });

  beforeEach(async () => {
    await router.push(`/logbook/${BasicUser.username}/${MinimalLogEntry.id}`);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    currentUser.user = { ...BasicUser };

    navigationObserver = new MockNavigationObserver(router, true);
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [NavigationObserverKey as symbol]: navigationObserver,
        },
        stubs: {
          StarRating: StarRatingStub,
          teleport: true,
        },
      },
      props: {
        entry: { ...MinimalLogEntry },
        tanks,
      },
    };
  });

  it('will validate for missing fields if one or more fields is filled', async () => {
    const wrapper = mount(EditLogbookEntry, opts);

    await wrapper.get(AddTankButton).trigger('click');
    await wrapper.get(startPressure(1)).setValue(3000);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(tankSelectError(1)).text()).toBe('Please select a tank');
    expect(wrapper.get(endPressureError(1)).text()).toBe(
      'End pressure is required',
    );

    await wrapper.get(tankSelect(1)).setValue(tanks[0].id);
    await wrapper.get(startPressure(1)).setValue('');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(startPressureError(1)).text()).toBe(
      'Start pressure is required',
    );

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will validate for invalid fields', async () => {
    const wrapper = mount(EditLogbookEntry, opts);

    await wrapper.get(AddTankButton).trigger('click');
    await flushPromises();
    const [, blankEntry] = wrapper.findAllComponents(EditEntryAir);

    blankEntry.get(tankSelect(1)).setValue(tanks[0].id);
    blankEntry.get(startPressure(1)).setValue('foo');
    blankEntry.get(endPressure(1)).setValue('bar');
    blankEntry.get(o2Percent(1)).setValue('baz');
    blankEntry.get(hePercent(1)).setValue('qux');

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.get(startPressureError(1)).text()).toBe(
      'Start pressure must be greater than 0 and less than 300bar / 4400psi',
    );
    expect(wrapper.get(endPressureError(1)).text()).toBe(
      'End pressure must be greater than 0 and cannot be greater than the start pressure',
    );
    expect(wrapper.get(o2PercentError(1)).text()).toBe(
      'O₂ percentage must be between 0 and 100',
    );
    expect(wrapper.get(hePercentError(1)).text()).toBe(
      'Helium percentage must be between 0 and 100',
    );

    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('will save a new air entry with minimal data', async () => {
    const expected: LogEntryDTO = {
      ...FullLogEntry,
      air: [
        ...FullLogEntry.air!,
        {
          count: 1,
          endPressure: 800,
          hePercent: 20,
          material: tanks[1].material,
          name: tanks[1].name,
          pressureUnit: PressureUnit.PSI,
          startPressure: 3000,
          volume: tanks[1].volume,
          workingPressure: tanks[1].workingPressure,
          o2Percent: 32,
        },
      ],
      site: undefined,
      operator: undefined,
    };

    const wrapper = mount(EditLogbookEntry, opts);
    await wrapper.setProps({
      entry: { ...FullLogEntry, site: undefined, operator: undefined },
    });
    await wrapper.get(AddTankButton).trigger('click');

    await wrapper.get(tankSelect(1)).setValue(tanks[1].id);
    await wrapper.get(pressureUnitToggle(1)).trigger('click');
    await wrapper.get(startPressure(1)).setValue(3000);
    await wrapper.get(endPressure(1)).setValue(800);
    await wrapper.get(o2Percent(1)).setValue(32);
    await wrapper.get(hePercent(1)).setValue(20);

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([[{ entry: expected }]]);
  });

  it('will allow a user to remove an air entry', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
    await wrapper.setProps({
      entry: {
        ...FullLogEntry,
        site: undefined,
        operator: undefined,
        air: [
          ...FullLogEntry.air!,
          {
            count: 1,
            endPressure: 800,
            hePercent: 20,
            material: tanks[1].material,
            name: tanks[1].name,
            pressureUnit: PressureUnit.PSI,
            startPressure: 3000,
            volume: tanks[1].volume,
            workingPressure: tanks[1].workingPressure,
            o2Percent: 32,
          },
        ],
      },
    });

    await wrapper.get(removeTankButton(1)).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    expect(wrapper.find(startPressure(1)).exists()).toBe(false);

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          entry: {
            ...FullLogEntry,
            site: undefined,
            air: [...FullLogEntry.air!],
          },
        },
      ],
    ]);
  });

  it('will allow a user to change their mind about removing an air tank', async () => {
    const wrapper = mount(EditLogbookEntry, {
      ...opts,
      props: {
        entry: {
          ...FullLogEntry,
          site: undefined,
          operator: undefined,
          air: [
            ...FullLogEntry.air!,
            {
              count: 1,
              endPressure: 800,
              hePercent: 20,
              material: tanks[1].material,
              name: tanks[1].name,
              pressureUnit: PressureUnit.PSI,
              startPressure: 3000,
              volume: tanks[1].volume,
              workingPressure: tanks[1].workingPressure,
              o2Percent: 32,
            },
          ],
        },
        tanks,
      },
    });
    await flushPromises();

    await wrapper.get(removeTankButton(1)).trigger('click');
    await wrapper.get(ConfirmDialog.Cancel).trigger('click');
    expect(wrapper.find(ConfirmDialog.DialogModal).exists()).toBe(false);
    expect(wrapper.find(startPressure(1)).isVisible()).toBe(true);
  });

  it('will not show remove tank button if there is only one entry', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
    await wrapper.setProps({ entry: { ...FullLogEntry } });
    expect(wrapper.find(removeTankButton(0)).exists()).toBe(false);
  });
});
