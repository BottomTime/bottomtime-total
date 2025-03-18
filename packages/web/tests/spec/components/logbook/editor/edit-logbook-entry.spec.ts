import {
  ApiClient,
  DepthUnit,
  ExposureSuit,
  LogEntryDTO,
  TankDTO,
  TankSchema,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  VueWrapper,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { NavigationObserverKey } from 'src/navigation-observer';
import dayjs from 'tests/dayjs';
import { MockNavigationObserver } from 'tests/mock-navigation-observer';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import DurationInput from '../../../../../src/components/common/duration-input.vue';
import FormDatePicker from '../../../../../src/components/common/form-date-picker.vue';
import FormTags from '../../../../../src/components/common/form-tags.vue';
import EditEntryAir from '../../../../../src/components/logbook/editor/edit-entry-air.vue';
import EditLogbookEntry from '../../../../../src/components/logbook/editor/edit-logbook-entry.vue';
import { useCurrentUser } from '../../../../../src/store';
import { createRouter } from '../../../../fixtures/create-router';
import {
  BlankLogEntry,
  FullLogEntry,
  MinimalLogEntry,
} from '../../../../fixtures/log-entries';
import TankData from '../../../../fixtures/tanks.json';
import { BasicUser } from '../../../../fixtures/users';
import StarRatingStub from '../../../../stubs/star-rating-stub.vue';

const LogNumberInput = '#logNumber';
const TimezoneSelect = '#entryTimeTimezone';
const MaxDepthInput = '#maxDepth';
const AvgDepthInput = '#avgDepth';
const DepthUnitToggle = '#maxDepth-unit';
const WeatherSelect = '#weather';
const AirTempInput = '#airTemp';
const WaterTempInput = '#waterTemp';
const ThermoclineInput = '#thermocline';
const TempUnitToggle = '#airTemp-unit';
const CurrentSlider = '#current';
const VisibilitySlider = '#visibility';
const ChopSlider = '#chop';
const WeightInput = '#weight';
const WeightUnitToggle = '#weight-unit';
const WeightAccuracySelect = '#weightCorrectness';
const TrimAccuracySelect = '#trim';
const SuitSelect = '#exposureSuit';
const BootsCheckbox = '#boots';
const HoodCheckbox = '#hood';
const GlovesCheckbox = '#gloves';
const CameraCheckbox = '#camera';
const ScooterCheckbox = '#scooter';
const TorchCheckbox = '#torch';
const NotesInput = '#notes';
const SaveButton = '#btnSave';

const LogNumberError = '[data-testid="logNumber-error"]';
const EntryTimeError = '[data-testid="dp-input-entryTime-error"]';
const DurationError = '[data-testid="duration-error"]';
const BottomTimeError = '[data-testid="bottomTime-error"]';
const SurfaceIntervalError = '[data-testid="surfaceInterval-error"]';
const MaxDepthError = '[data-testid="maxDepth-error"]';
const AvgDepthError = '[data-testid="avgDepth-error"]';
const AirTempError = '[data-testid="airTemp-error"]';
const WaterTempError = '[data-testid="waterTemp-error"]';
const ThermoclineError = '[data-testid="thermocline-error"]';
const WeightError = '[data-testid="weight-error"]';

function compareForm(
  wrapper: VueWrapper<InstanceType<typeof EditLogbookEntry>>,
  entry: LogEntryDTO,
) {
  // Basic props
  expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
    entry.logNumber?.toString() || '',
  );
  expect(wrapper.getComponent(FormDatePicker).props('modelValue')).toEqual(
    isNaN(entry.timing.entryTime)
      ? undefined
      : dayjs(entry.timing.entryTime).tz(entry.timing.timezone, false).toDate(),
  );
  expect(wrapper.get<HTMLSelectElement>(TimezoneSelect).element.value).toBe(
    entry.timing.timezone || 'America/Los_Angeles',
  );

  const [duration, bottomTime, surfaceInterval] =
    wrapper.findAllComponents(DurationInput);
  expect(duration.props('modelValue')).toBe(
    entry.timing.duration === -1 ? '' : entry.timing.duration,
  );
  expect(bottomTime.props('modelValue')).toBe(entry.timing.bottomTime ?? '');
  expect(surfaceInterval.props('modelValue')).toBe(
    entry.timing.surfaceInterval ?? '',
  );

  expect(wrapper.get<HTMLInputElement>(MaxDepthInput).element.value).toBe(
    entry.depths?.maxDepth?.toString() ?? '',
  );
  expect(wrapper.get<HTMLInputElement>(AvgDepthInput).element.value).toBe(
    entry.depths?.averageDepth?.toString() ?? '',
  );

  expect(wrapper.getComponent(FormTags).props('modelValue')).toEqual(
    entry.tags ?? [],
  );

  // Conditions
  expect(wrapper.get<HTMLSelectElement>(WeatherSelect).element.value).toBe(
    entry.conditions?.weather ?? '',
  );
  expect(wrapper.get<HTMLInputElement>(AirTempInput).element.value).toBe(
    entry.conditions?.airTemperature?.toString() ?? '',
  );
  expect(wrapper.get<HTMLInputElement>(WaterTempInput).element.value).toBe(
    entry.conditions?.surfaceTemperature?.toString() ?? '',
  );
  expect(wrapper.get<HTMLInputElement>(ThermoclineInput).element.value).toBe(
    entry.conditions?.bottomTemperature?.toString() ?? '',
  );
  expect(wrapper.get(TempUnitToggle).text()).toBe(
    `°${
      entry.conditions?.temperatureUnit ?? BasicUser.settings.temperatureUnit
    }`,
  );
  expect(wrapper.get<HTMLInputElement>(CurrentSlider).element.value).toBe(
    entry.conditions?.current?.toString() ?? '0',
  );
  expect(wrapper.get<HTMLInputElement>(VisibilitySlider).element.value).toBe(
    entry.conditions?.visibility?.toString() ?? '0',
  );
  expect(wrapper.get<HTMLInputElement>(ChopSlider).element.value).toBe(
    entry.conditions?.chop?.toString() ?? '0',
  );

  // Breathing gas
  const air = wrapper.findAllComponents(EditEntryAir);
  expect(air).toHaveLength(entry.air?.length ?? 1);
  if (entry.air) {
    air.forEach((a, i) => {
      const props = a.props();
      const expected = entry.air![i];
      expect(props.ordinal).toBe(i);
      expect(props.air).toMatchObject({
        doubles: expected.count > 1,
        endPressure: expected.endPressure,
        hePercent: expected.hePercent,
        id: props.air.id,
        o2Percent: expected.o2Percent,
        pressureUnit: expected.pressureUnit,
        startPressure: expected.startPressure,
        tankInfo: {
          isSystem: false,
          material: expected.material,
          name: expected.name,
          volume: expected.volume,
          workingPressure: expected.workingPressure,
        },
      });
    });
  }

  // Equipment
  expect(wrapper.get<HTMLInputElement>(WeightInput).element.value).toBe(
    entry.equipment?.weight?.toString() ?? '',
  );
  expect(wrapper.get(WeightUnitToggle).text()).toBe(
    entry.equipment?.weightUnit ?? BasicUser.settings.weightUnit,
  );
  expect(
    wrapper.get<HTMLSelectElement>(WeightAccuracySelect).element.value,
  ).toBe(entry.equipment?.weightCorrectness ?? '');
  expect(wrapper.get<HTMLSelectElement>(TrimAccuracySelect).element.value).toBe(
    entry.equipment?.trimCorrectness ?? '',
  );
  expect(wrapper.get<HTMLInputElement>(SuitSelect).element.value).toBe(
    entry.equipment?.exposureSuit ?? '',
  );
  expect(wrapper.get<HTMLInputElement>(BootsCheckbox).element.checked).toBe(
    entry.equipment?.boots ?? false,
  );
  expect(wrapper.get<HTMLInputElement>(HoodCheckbox).element.checked).toBe(
    entry.equipment?.hood ?? false,
  );
  expect(wrapper.get<HTMLInputElement>(GlovesCheckbox).element.checked).toBe(
    entry.equipment?.gloves ?? false,
  );
  expect(wrapper.get<HTMLInputElement>(CameraCheckbox).element.checked).toBe(
    entry.equipment?.camera ?? false,
  );
  expect(wrapper.get<HTMLInputElement>(ScooterCheckbox).element.checked).toBe(
    entry.equipment?.scooter ?? false,
  );
  expect(wrapper.get<HTMLInputElement>(TorchCheckbox).element.checked).toBe(
    entry.equipment?.torch ?? false,
  );

  // Notes
  expect(wrapper.get<HTMLTextAreaElement>(NotesInput).element.value).toBe(
    entry.notes ?? '',
  );
  expect(wrapper.getComponent(StarRatingStub).props('modelValue')).toBe(
    entry.rating ?? 0,
  );
}

describe('Log entry editor', () => {
  let client: ApiClient;
  let router: Router;
  let tankData: TankDTO[];

  let pinia: Pinia;
  let navigationObserver: MockNavigationObserver;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof EditLogbookEntry>;

  beforeAll(() => {
    client = new ApiClient();
    tankData = TankSchema.array().parse(TankData.data).slice(0, 5);
    router = createRouter([
      {
        path: '/logbook/:username',
        component: { template: '<div></div>' },
      },
      {
        path: '/logbook/:username/new',
        component: { template: '<div></div>' },
      },
      {
        path: '/logbook/:username/:entryId',
        component: { template: '<div></div>' },
      },
    ]);
  });

  beforeEach(async () => {
    await router.push(`/logbook/${BasicUser.username}/${FullLogEntry.id}`);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);

    currentUser.user = { ...BasicUser };

    navigationObserver = new MockNavigationObserver(router);
    opts = {
      props: {
        entry: { ...FullLogEntry },
        tanks: tankData,
      },
      global: {
        provide: {
          [ApiClientKey as symbol]: client,
          [NavigationObserverKey as symbol]: navigationObserver,
        },
        plugins: [pinia, router],
        stubs: {
          StarRating: StarRatingStub,
          teleport: true,
        },
      },
    };
  });

  describe('when mounting with a logbook entry', () => {
    it('will mount full logbook entry with all fields filled in', () => {
      const wrapper = mount(EditLogbookEntry, opts);
      compareForm(wrapper, FullLogEntry);
    });

    it('will mount a minimal log entry with only required fields', async () => {
      const wrapper = mount(EditLogbookEntry, opts);
      await wrapper.setProps({ entry: MinimalLogEntry });
      compareForm(wrapper, MinimalLogEntry);
    });

    it('will mount a blank log entry for entering a brand new log entry', async () => {
      const wrapper = mount(EditLogbookEntry, opts);
      await wrapper.setProps({ entry: BlankLogEntry });
      compareForm(wrapper, BlankLogEntry);
    });

    it('will look up next available log number when mounting a brand new log entry', async () => {
      const logNumber = 137;
      jest
        .spyOn(client.logEntries, 'getNextAvailableLogNumber')
        .mockResolvedValue(logNumber);

      await router.push(`/logbook/${BasicUser.username}/new`);
      const wrapper = mount(EditLogbookEntry, {
        ...opts,
        props: { entry: BlankLogEntry, tanks: tankData },
      });
      await flushPromises();

      expect(wrapper.get<HTMLInputElement>(LogNumberInput).element.value).toBe(
        logNumber.toString(),
      );
    });
  });

  describe('when validating input', () => {
    let wrapper: VueWrapper<InstanceType<typeof EditLogbookEntry>>;

    beforeEach(() => {
      wrapper = mount(EditLogbookEntry, {
        ...opts,
        props: { entry: { ...MinimalLogEntry }, tanks: tankData },
      });
    });

    afterEach(() => {
      expect(wrapper.emitted('save')).toBeUndefined();
    });

    it('will check that log number is a valid number', async () => {
      await wrapper.get(LogNumberInput).setValue('abc');
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(LogNumberError).text()).toBe(
        'Log number must be a positive integer',
      );
    });

    it('will check that entry time is provided', async () => {
      await wrapper.getComponent(FormDatePicker).setValue(undefined);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(EntryTimeError).text()).toBe('Entry time is required');
    });

    it.skip('will check that entry time is valid', async () => {
      await wrapper
        .getComponent(FormDatePicker)
        .setValue(new Date(Date.now() + 3000));
      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();
      expect(wrapper.get(EntryTimeError).text()).toBe('Entry time is required');
    });

    it('will check that duration was provided', async () => {
      await wrapper.getComponent(DurationInput).setValue('');
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(DurationError).text()).toBe('Duration is required');
    });

    it('will check that duration is a valid number', async () => {
      await wrapper.getComponent(DurationInput).setValue(-1);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(DurationError).text()).toBe(
        'Duration must be a positive number',
      );
    });

    it('will check that bottom time is a valid number', async () => {
      const [, bottomTime] = wrapper.findAllComponents(DurationInput);
      await bottomTime.setValue(-1);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(BottomTimeError).text()).toBe(
        'Bottom time must be a positive number',
      );
    });

    it('will check that surface interval is a valid number', async () => {
      const [, , surfaceInterval] = wrapper.findAllComponents(DurationInput);
      await surfaceInterval.setValue('abc');
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(SurfaceIntervalError).text()).toBe(
        'Surface interval time must be a positive number',
      );
    });

    it('will check that max depth is valid', async () => {
      await wrapper.get(MaxDepthInput).setValue(-2);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(MaxDepthError).text()).toBe(
        'Depth must be numeric and greater than zero',
      );
    });

    it('will check that average depth is valid', async () => {
      await wrapper.get(AvgDepthInput).setValue('abc');
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(AvgDepthError).text()).toBe(
        'Depth must be numeric and greater than zero',
      );
    });

    it('will check that air temperature is valid', async () => {
      await wrapper.get(AirTempInput).setValue(-12323);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(AirTempError).text()).toBe(
        'Air temperature must be between -50 and 60°C (-58 and 140°F)',
      );
    });

    it('will check that water temperature is valid', async () => {
      await wrapper.get(WaterTempInput).setValue(999999);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(WaterTempError).text()).toBe(
        'Water temperature must be between -2 and 60°C (28 and 140°F)',
      );
    });

    it('will check that thermocline temperature is valid', async () => {
      await wrapper.get(ThermoclineInput).setValue('abc');
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(ThermoclineError).text()).toBe(
        'Thermocline temperature must be between -2 and 60°C (28 and 140°F)',
      );
    });

    it('will check that weight is valid', async () => {
      await wrapper.get(WeightInput).setValue(-1);
      await wrapper.get(SaveButton).trigger('click');
      expect(wrapper.get(WeightError).text()).toBe(
        'Weight must be numeric and cannot be less than zero',
      );
    });
  });

  describe('when saving changes', () => {
    it('will emit a save event when the log entry is saved', async () => {
      const expected: LogEntryDTO = {
        ...FullLogEntry,
        logNumber: 777,
        conditions: {
          weather: 'Overcast',
          airTemperature: 18.2,
          bottomTemperature: 7.4,
          surfaceTemperature: 12.3,
          chop: 3,
          current: 2,
          visibility: 4.5,
          temperatureUnit: TemperatureUnit.Celsius,
        },
        depths: {
          maxDepth: 21.3,
          averageDepth: 16.5,
          depthUnit: DepthUnit.Meters,
        },
        equipment: {
          boots: true,
          camera: false,
          exposureSuit: ExposureSuit.Wetsuit3mm,
          gloves: false,
          hood: false,
          scooter: false,
          torch: false,
          trimCorrectness: TrimCorrectness.KneesDown,
          weight: 3.2,
          weightCorrectness: WeightCorrectness.Over,
          weightUnit: WeightUnit.Kilograms,
        },
        notes: 'Updated notes',
        rating: 3.88,
        timing: {
          entryTime: new Date('2024-07-23T12:52:10Z').valueOf(),
          timezone: 'America/St_Johns',
          duration: 2183,
          bottomTime: 2022,
        },
        operator: undefined,
        site: undefined,
      };
      expected.air![0].name = tankData[0].name;
      expected.air![0].volume = tankData[0].volume;

      const wrapper = mount(EditLogbookEntry, opts);

      await wrapper.get(LogNumberInput).setValue(expected.logNumber);
      await wrapper
        .getComponent(FormDatePicker)
        .setValue(
          dayjs(expected.timing.entryTime)
            .tz(expected.timing.timezone, false)
            .toDate(),
        );
      await wrapper.get(TimezoneSelect).setValue(expected.timing.timezone);
      const [duration, bottomTime, surfaceInterval] =
        wrapper.findAllComponents(DurationInput);
      await duration.setValue(expected.timing.duration);
      await bottomTime.setValue(expected.timing.bottomTime);
      await surfaceInterval.setValue('');
      await wrapper.get(DepthUnitToggle).trigger('click');
      await wrapper.get(MaxDepthInput).setValue(expected.depths?.maxDepth);
      await wrapper.get(AvgDepthInput).setValue(expected.depths?.averageDepth);

      await wrapper.get(WeatherSelect).setValue(expected.conditions?.weather);
      await wrapper.get(TempUnitToggle).trigger('click');
      await wrapper
        .get(AirTempInput)
        .setValue(expected.conditions?.airTemperature);
      await wrapper
        .get(WaterTempInput)
        .setValue(expected.conditions?.surfaceTemperature);
      await wrapper
        .get(ThermoclineInput)
        .setValue(expected.conditions?.bottomTemperature);
      await wrapper.get(CurrentSlider).setValue(expected.conditions?.current);
      await wrapper
        .get(VisibilitySlider)
        .setValue(expected.conditions?.visibility);
      await wrapper.get(ChopSlider).setValue(expected.conditions?.chop);

      await wrapper.get(WeightUnitToggle).trigger('click');
      await wrapper.get(WeightInput).setValue(expected.equipment?.weight);
      await wrapper
        .get(WeightAccuracySelect)
        .setValue(expected.equipment?.weightCorrectness);
      await wrapper
        .get(TrimAccuracySelect)
        .setValue(expected.equipment?.trimCorrectness);
      await wrapper.get(SuitSelect).setValue(expected.equipment?.exposureSuit);
      await wrapper.get(BootsCheckbox).setValue(expected.equipment?.boots);
      await wrapper.get(HoodCheckbox).setValue(expected.equipment?.hood);
      await wrapper.get(GlovesCheckbox).setValue(expected.equipment?.gloves);
      await wrapper.get(CameraCheckbox).setValue(expected.equipment?.camera);
      await wrapper.get(ScooterCheckbox).setValue(expected.equipment?.scooter);
      await wrapper.get(TorchCheckbox).setValue(expected.equipment?.torch);

      await wrapper.get(NotesInput).setValue(expected.notes);
      await wrapper.getComponent(StarRatingStub).setValue(expected.rating);

      await wrapper
        .get('[data-testid="tanks-select-0"]')
        .setValue(tankData[0].id);
      await wrapper
        .get('[data-testid="start-pressure-0"]')
        .setValue(FullLogEntry.air![0].startPressure);
      await wrapper
        .get('[data-testid="end-pressure-0"]')
        .setValue(FullLogEntry.air![0].endPressure);
      await wrapper
        .get('[data-testid="o2-0"]')
        .setValue(FullLogEntry.air![0].o2Percent);
      await wrapper
        .get('[data-testid="he-0"]')
        .setValue(FullLogEntry.air![0].hePercent);

      await wrapper.get(SaveButton).trigger('click');
      await flushPromises();

      expect(wrapper.emitted('save')).toEqual([
        [
          {
            entry: expected,
          },
        ],
      ]);
    });
  });
});
