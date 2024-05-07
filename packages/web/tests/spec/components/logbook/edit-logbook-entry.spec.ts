import { DepthUnit } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import { Pinia, createPinia } from 'pinia';

import FormDatePicker from '../../../../src/components/common/form-date-picker.vue';
import EditLogbookEntry from '../../../../src/components/logbook/edit-logbook-entry.vue';
import {
  BlankLogEntry,
  FullLogEntry,
  MinimalLogEntry,
} from '../../../fixtures/log-entries';

dayjs.extend(tz);

const LogNumberInput = '#logNumber';
const TimezoneSelect = '#entryTimeTimezone';
const DurationInput = '#duration';
const BottomTimeInput = '#bottomTime';
const MaxDepthInput = '#maxDepth';
const NotesInput = '#notes';
const SaveButton = '#btnSave';
const CancelButton = '#btnCancel';

const Timezone = 'Pacific/Guam';

describe('EditLogbookEntry component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditLogbookEntry>;

  beforeEach(() => {
    jest.spyOn(dayjs.tz, 'guess').mockReturnValue(Timezone);

    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
      },
      props: { entry: BlankLogEntry },
    };
  });

  it('will render correctly for a new, blank entry', () => {
    const wrapper = mount(EditLogbookEntry, opts);
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
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe('');
  });

  it('will load values for minimal log entry', () => {
    opts.props = { entry: MinimalLogEntry };
    const wrapper = mount(EditLogbookEntry, opts);
    expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
      '',
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
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe('');
  });

  it('will load values for full log entry', () => {
    opts.props = { entry: FullLogEntry };
    const wrapper = mount(EditLogbookEntry, opts);
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
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe(
      FullLogEntry.notes,
    );
  });

  it('will disable form when isSaving is true', () => {
    opts.props!.isSaving = true;
    const wrapper = mount(EditLogbookEntry, opts);
    expect(wrapper.find<HTMLFieldSetElement>('fieldset').element.disabled).toBe(
      true,
    );
    expect(wrapper.get<HTMLButtonElement>(SaveButton).element.disabled).toBe(
      true,
    );
  });

  it('will validate missing fields', async () => {
    const wrapper = mount(EditLogbookEntry, opts);
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

    await wrapper.get(LogNumberInput).setValue('nope');
    await wrapper.get(DurationInput).setValue('-2.3');
    await wrapper.get(BottomTimeInput).setValue('lol');
    await wrapper.get(MaxDepthInput).setValue('wat');
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
      'Must be a valid depth',
    );
  });

  it('will emit "save" event when save button is clicked and form is valid', async () => {
    const logNumber = 88;
    const entryTime = new Date('2024-05-07T14:41:06');
    const timezone = 'America/Vancouver';
    const duration = 44.1;
    const bottomTime = 41.8;
    const maxDepth = 33.3;
    const notes = 'hello';

    const wrapper = mount(EditLogbookEntry, opts);

    await wrapper.get(LogNumberInput).setValue(logNumber.toString());
    await wrapper.getComponent(FormDatePicker).setValue(entryTime);
    await wrapper.get(TimezoneSelect).setValue(timezone);
    await wrapper.get(DurationInput).setValue(duration.toString());
    await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
    await wrapper.get(MaxDepthInput).setValue(maxDepth);
    await wrapper.get(NotesInput).setValue(notes);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          ...BlankLogEntry,
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
    const notes = 'hello';

    const wrapper = mount(EditLogbookEntry, opts);

    await wrapper.get(LogNumberInput).setValue(logNumber.toString());
    await wrapper.getComponent(FormDatePicker).setValue(entryTime);
    await wrapper.get(TimezoneSelect).setValue(timezone);
    await wrapper.get(DurationInput).setValue(duration.toString());
    await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
    await wrapper.get(MaxDepthInput).setValue(maxDepth);
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
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe('');
  });

  it('will allow users to change their mind about reverting changes', async () => {
    const logNumber = 88;
    const entryTime = new Date('2024-05-07T14:41:06');
    const timezone = 'America/Vancouver';
    const duration = 44.1;
    const bottomTime = 41.8;
    const maxDepth = 33.3;
    const notes = 'hello';

    const wrapper = mount(EditLogbookEntry, opts);

    await wrapper.get(LogNumberInput).setValue(logNumber.toString());
    await wrapper.getComponent(FormDatePicker).setValue(entryTime);
    await wrapper.get(TimezoneSelect).setValue(timezone);
    await wrapper.get(DurationInput).setValue(duration.toString());
    await wrapper.get(BottomTimeInput).setValue(bottomTime.toString());
    await wrapper.get(MaxDepthInput).setValue(maxDepth);
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
    expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe(
      notes,
    );
  });
});
