import {
  ApiClient,
  DepthUnit,
  DiveSiteDTO,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  LogBookSharing,
  PressureUnit,
  WeightUnit,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import FormDatePicker from '../../../../src/components/common/form-date-picker.vue';
import SelectSite from '../../../../src/components/diveSites/selectSite/select-site.vue';
import EditEntryAir from '../../../../src/components/logbook/edit-entry-air.vue';
import EditLogbookEntry from '../../../../src/components/logbook/edit-logbook-entry.vue';
import { createRouter } from '../../../fixtures/create-router';
import {
  BlankLogEntry,
  FullLogEntry,
  MinimalLogEntry,
} from '../../../fixtures/log-entries';
import { DiveSiteWithMinimalProperties } from '../../../fixtures/sites';
import TankData from '../../../fixtures/tanks.json';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(tz);
jest.mock('uuid');

const LogNumberInput = '#logNumber';
const TimezoneSelect = '#entryTimeTimezone';
const DurationInput = '#duration';
const BottomTimeInput = '#bottomTime';
const MaxDepthInput = '#maxDepth';
const WeightInput = '#weights';
const WeightUnitButton = '#weights-unit';
const NotesInput = '#notes';
const SaveButton = '#btnSave';
const CancelButton = '#btnCancel';
const AddTankButton = '#btn-add-tank';

const DiveSite: DiveSiteDTO = {
  createdOn: new Date(),
  creator: {
    logBookSharing: LogBookSharing.FriendsOnly,
    memberSince: new Date(),
    userId: '7ba2eebd-9747-4adb-a820-f268cb6c84f3',
    username: 'diver_dan',
  },
  id: '31c28b81-d859-4de6-a716-3e01f3aab6ab',
  location: 'Australia',
  name: 'Test Dive Site',
};

const Timezone = 'Pacific/Guam';
const LogNumber = 99;

describe('EditLogbookEntry component', () => {
  let router: Router;
  let client: ApiClient;
  let tankData: ListTanksResponseDTO;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditLogbookEntry>;

  beforeAll(() => {
    router = createRouter([
      {
        path: '/logbook/:username',
        name: 'Logbook',
        component: EditLogbookEntry,
      },
    ]);
    client = new ApiClient();
    tankData = ListTanksResponseSchema.parse(TankData);
  });

  beforeEach(async () => {
    jest.spyOn(dayjs.tz, 'guess').mockReturnValue(Timezone);
    jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValueOnce(LogNumber);

    await router.push(`/logbook/${BasicUser.username}`);

    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
      props: { entry: BlankLogEntry, tanks: tankData.tanks },
    };
  });

  it('will render correctly for a new, blank entry', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      LogNumber.toString(),
    );
    expect(
      wrapper.getComponent(FormDatePicker).props().modelValue,
    ).toBeUndefined();
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      Timezone,
    );
    expect(wrapper.get<HTMLInputElement>(DurationInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(BottomTimeInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WeightInput).element.value).toBe('');
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe('');
  });

  it('will load values for minimal log entry', async () => {
    opts.props = { entry: MinimalLogEntry, tanks: tankData.tanks };
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      LogNumber.toString(),
    );
    expect(wrapper.getComponent(FormDatePicker).props().modelValue).toEqual(
      new Date(FullLogEntry.entryTime.date),
    );
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      MinimalLogEntry.entryTime.timezone,
    );
    expect(wrapper.get<HTMLInputElement>(DurationInput).element.value).toBe(
      MinimalLogEntry.duration.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(BottomTimeInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WeightInput).element.value).toBe('');
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe('');
  });

  it('will load values for full log entry', async () => {
    opts.props = { entry: FullLogEntry, tanks: tankData.tanks };
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      FullLogEntry.logNumber?.toString(),
    );
    expect(wrapper.getComponent(FormDatePicker).props().modelValue).toEqual(
      new Date(FullLogEntry.entryTime.date),
    );
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      FullLogEntry.entryTime.timezone,
    );
    expect(wrapper.get<HTMLInputElement>(DurationInput).element.value).toBe(
      FullLogEntry.duration.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(BottomTimeInput).element.value).toBe(
      FullLogEntry.bottomTime?.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe(
      FullLogEntry.maxDepth?.depth.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(WeightInput).element.value).toBe(
      FullLogEntry.weights!.weight.toString(),
    );
    expect(wrapper.get(WeightUnitButton).text()).toBe(
      FullLogEntry.weights!.unit,
    );
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe(
      FullLogEntry.notes,
    );
  });

  it('will disable form when isSaving is true', async () => {
    opts.props!.isSaving = true;
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    expect(wrapper.find<HTMLFieldSetElement>('fieldset').element.disabled).toBe(
      true,
    );
    expect(wrapper.get<HTMLButtonElement>(SaveButton).element.disabled).toBe(
      true,
    );
  });

  it('will validate missing fields', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    await wrapper.get(SaveButton).trigger('click');

    expect(
      wrapper.find('[data-testid="dp-input-entryTime-error"]').text(),
    ).toBe('Entry time is required');
    expect(wrapper.find('[data-testid="duration-error"]').text()).toBe(
      'Duration is required',
    );
  });

  it('will validate invalid fields', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    await wrapper.get(LogNumberInput).setValue('nope');
    await wrapper.get(DurationInput).setValue('-2.3');
    await wrapper.get(BottomTimeInput).setValue('lol');
    await wrapper.get(MaxDepthInput).setValue('wat');
    await wrapper.get(WeightInput).setValue('a few pounds');
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="logNumber-error"]').text()).toBe(
      'Log number must be a positive integer',
    );
    expect(wrapper.find('[data-testid="duration-error"]').text()).toBe(
      'Duration must be a positive number',
    );
    expect(wrapper.find('[data-testid="bottomTime-error"]').text()).toBe(
      'Bottom time must be a positive number',
    );
    expect(wrapper.find('[data-testid="maxDepth-error"]').text()).toBe(
      'Depth must be numeric and greater than zero',
    );
    expect(wrapper.find('[data-testid="weights-error"]').text()).toBe(
      'Weight must be numeric and cannot be less than zero',
    );
  });

  it('will emit "save" event when save button is clicked and form is valid', async () => {
    const logNumber = 88;
    const entryTime = new Date('2024-05-07T14:41:06');
    const timezone = 'America/Vancouver';
    const duration = 44.1;
    const bottomTime = 41.8;
    const maxDepth = 33.3;
    const weight = 4.8;
    const notes = 'hello';

    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    await wrapper.get(LogNumberInput).setValue(logNumber.toString());
    await wrapper.getComponent(FormDatePicker).setValue(entryTime);
    await wrapper.get(TimezoneSelect).setValue(timezone);
    await wrapper.get(DurationInput).setValue(duration.toString());
    await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
    await wrapper.get(MaxDepthInput).setValue(maxDepth);
    await wrapper.get(WeightInput).setValue(weight.toString());
    await wrapper.get(NotesInput).setValue(notes);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          ...BlankLogEntry,
          air: [],
          bottomTime,
          duration,
          logNumber,
          maxDepth: {
            depth: maxDepth,
            unit: DepthUnit.Meters,
          },
          notes,
          entryTime: {
            date: dayjs(entryTime).format('YYYY-MM-DDTHH:mm:ss'),
            timezone: 'America/Vancouver',
          },
          weights: {
            unit: WeightUnit.Kilograms,
            weight,
          },
        },
      ],
    ]);
  });

  it('will allow users to revert changes', async () => {
    const logNumber = 88;
    const entryTime = new Date('2024-05-07T14:41:06');
    const timezone = 'America/Vancouver';
    const duration = 44.1;
    const bottomTime = 41.8;
    const maxDepth = 33.3;
    const weight = 4.8;
    const notes = 'hello';

    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    await wrapper.get(LogNumberInput).setValue(logNumber.toString());
    await wrapper.getComponent(FormDatePicker).setValue(entryTime);
    await wrapper.get(TimezoneSelect).setValue(timezone);
    await wrapper.get(DurationInput).setValue(duration.toString());
    await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
    await wrapper.get(MaxDepthInput).setValue(maxDepth);
    await wrapper.get(WeightInput).setValue(weight);
    await wrapper.get(NotesInput).setValue(notes);
    await wrapper.get(CancelButton).trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      '',
    );
    expect(
      wrapper.getComponent(FormDatePicker).props().modelValue,
    ).toBeUndefined();
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      Timezone,
    );
    expect(wrapper.get<HTMLInputElement>(DurationInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(BottomTimeInput).element.value).toBe(
      '',
    );
    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(WeightInput).element.value).toBe('');
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe('');
  });

  it('will allow users to change their mind about reverting changes', async () => {
    const logNumber = 88;
    const entryTime = new Date('2024-05-07T14:41:06');
    const timezone = 'America/Vancouver';
    const duration = 44.1;
    const bottomTime = 41.8;
    const maxDepth = 33.3;
    const weight = 4.8;
    const notes = 'hello';

    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    await wrapper.get(LogNumberInput).setValue(logNumber.toString());
    await wrapper.getComponent(FormDatePicker).setValue(entryTime);
    await wrapper.get(TimezoneSelect).setValue(timezone);
    await wrapper.get(DurationInput).setValue(duration.toString());
    await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
    await wrapper.get(MaxDepthInput).setValue(maxDepth);
    await wrapper.get(WeightInput).setValue(weight);
    await wrapper.get(NotesInput).setValue(notes);
    await wrapper.get(CancelButton).trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      logNumber.toString(),
    );
    expect(wrapper.getComponent(FormDatePicker).props().modelValue).toEqual(
      entryTime,
    );
    expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
      timezone,
    );
    expect(wrapper.get<HTMLInputElement>(DurationInput).element.value).toBe(
      duration.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(BottomTimeInput).element.value).toBe(
      bottomTime.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe(
      maxDepth.toString(),
    );
    expect(wrapper.get<HTMLInputElement>(WeightInput).element.value).toBe(
      weight.toString(),
    );
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe(
      notes,
    );
  });

  it('will fetch the next available log number when the button is clicked', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'getNextAvailableLogNumber')
      .mockResolvedValueOnce(123);

    const wrapper = mount(EditLogbookEntry, opts);
    await wrapper.get('[data-testid="get-next-log-number"]').trigger('click');
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username);
    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      '123',
    );
  });

  it('will allow user to select a dive site', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
    await flushPromises();

    await wrapper.get('[data-testid="btn-select-site"]').trigger('click');
    const selectSite = wrapper.findComponent(SelectSite);
    expect(selectSite.isVisible()).toBe(true);
    selectSite.vm.$emit('site-selected', DiveSite);
    await flushPromises();

    expect(wrapper.get('[data-testid="btn-site-name"]').text()).toBe(
      DiveSite.name,
    );
  });

  it('will allow a user to change the selected dive site', async () => {
    opts.props = {
      entry: {
        ...BlankLogEntry,
        site: { ...DiveSiteWithMinimalProperties },
      },
      tanks: tankData.tanks,
    };
    const wrapper = mount(EditLogbookEntry, opts);
    await wrapper.get('[data-testid="btn-change-site"]').trigger('click');

    const selectSite = wrapper.findComponent(SelectSite);
    expect(selectSite.isVisible()).toBe(true);
    selectSite.vm.$emit('site-selected', DiveSite);
    await flushPromises();

    expect(wrapper.get('[data-testid="btn-site-name"]').text()).toBe(
      DiveSite.name,
    );
  });

  describe('when working with air tank entries', () => {
    it('will allow the user to save a logbook entry with air tanks', async () => {
      const entryTime = new Date('2024-05-07T14:41:06');
      const timezone = 'America/Vancouver';
      const duration = 44.1;
      const bottomTime = 41.8;
      const maxDepth = 33.3;
      const notes = 'hello';
      const air = {
        startPressure: 207,
        count: 2,
        endPressure: 50,
        o2Percent: 21,
        hePercent: 40,
        tankId: tankData.tanks[0].id,
      };

      const wrapper = mount(EditLogbookEntry, opts);
      await flushPromises();

      await wrapper.get(LogNumberInput).setValue('88');
      await wrapper.getComponent(FormDatePicker).setValue(entryTime);
      await wrapper.get(TimezoneSelect).setValue(timezone);
      await wrapper.get(DurationInput).setValue(duration.toString());
      await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
      await wrapper.get(MaxDepthInput).setValue(maxDepth);
      await wrapper.get(NotesInput).setValue(notes);

      await wrapper.get(AddTankButton).trigger('click');
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

      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(wrapper.emitted('save')).toEqual([
        [
          {
            ...BlankLogEntry,
            air: [
              {
                count: air.count,
                endPressure: air.endPressure,
                hePercent: air.hePercent,
                material: tankData.tanks[0].material,
                name: tankData.tanks[0].name,
                o2Percent: air.o2Percent,
                pressureUnit: PressureUnit.Bar,
                startPressure: air.startPressure,
                volume: tankData.tanks[0].volume,
                workingPressure: tankData.tanks[0].workingPressure,
              },
            ],
            bottomTime,
            duration,
            logNumber: 88,
            maxDepth: {
              depth: maxDepth,
              unit: DepthUnit.Meters,
            },
            notes,
            entryTime: {
              date: dayjs(entryTime).format('YYYY-MM-DDTHH:mm:ss'),
              timezone: 'America/Vancouver',
            },
          },
        ],
      ]);
    });

    it('will validate missing fields for air tank entries', async () => {
      const wrapper = mount(EditLogbookEntry, opts);
      await flushPromises();

      await wrapper.get(AddTankButton).trigger('click');
      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(
        wrapper.find('[data-testid="form-errors"]').text(),
      ).toMatchSnapshot();

      const airEntry = wrapper.getComponent(EditEntryAir);
      expect(airEntry.text()).toMatchSnapshot();
    });

    it('will validate invalid fields for air tank entries', async () => {
      const wrapper = mount(EditLogbookEntry, opts);
      await flushPromises();

      await wrapper.get(AddTankButton).trigger('click');
      await wrapper.get('[data-testid="tanks-select"]').setValue('');
      await wrapper.get('[data-testid="start-pressure"]').setValue('nope');
      await wrapper.get('[data-testid="end-pressure"]').setValue('lol');
      await wrapper.get('[data-testid="o2"]').setValue('-1');
      await wrapper.get('[data-testid="he"]').setValue('101');
      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(
        wrapper.find('[data-testid="form-errors"]').text(),
      ).toMatchSnapshot();

      const airEntry = wrapper.getComponent(EditEntryAir);
      expect(airEntry.text()).toMatchSnapshot();
    });
  });
});
