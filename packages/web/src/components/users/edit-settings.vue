<template>
  <ConfirmDialog
    confirm-text="Reset Settings"
    title="Reset Settings?"
    :visible="showConfirmResetDialog"
    @confirm="onConfirmReset"
    @cancel="onCancelReset"
  >
    <div class="flex flex-row gap-4">
      <span class="pt-2">
        <i class="fas fa-question-circle fa-2x"></i>
      </span>
      <p>
        Are you sure you want to cancel the changes you have made to your
        settings?
      </p>
    </div>
  </ConfirmDialog>

  <form @submit.prevent="">
    <fieldset :disabled="isSaving">
      <TextHeading>Preferred Units</TextHeading>
      <FormField :responsive="responsive">
        <div class="flex gap-3">
          <FormButton
            type="link"
            test-id="select-all-metric"
            @click="onAllMetric"
          >
            All Metric
          </FormButton>
          <FormButton
            type="link"
            test-id="select-all-imperial"
            @click="onAllImperial"
          >
            All Imperial
          </FormButton>
        </div>
      </FormField>

      <FormField label="Depth" :responsive="responsive">
        <div
          :class="`flex flex-col gap-3 ${
            responsive ? 'md:flex-row md:gap-0 pl-4 lg:pl-0' : ''
          }`"
        >
          <FormRadio
            v-for="option in DepthOptions"
            :key="option.id"
            v-model="data.depthUnit"
            class="w-36"
            :control-id="option.id"
            :group="option.group"
            :value="option.value"
          >
            {{ option.label }}
          </FormRadio>
        </div>
      </FormField>

      <FormField label="Pressure" :responsive="responsive">
        <div
          :class="`flex flex-col gap-3 ${
            responsive ? 'md:flex-row md:gap-0 pl-4 lg:pl-0' : ''
          }`"
        >
          <FormRadio
            v-for="option in PressureOptions"
            :key="option.id"
            v-model="data.pressureUnit"
            class="w-36"
            :control-id="option.id"
            :group="option.group"
            :value="option.value"
          >
            {{ option.label }}
          </FormRadio>
        </div>
      </FormField>

      <FormField label="Temperature" :responsive="responsive">
        <div
          :class="`flex flex-col gap-3 ${
            responsive ? 'md:flex-row md:gap-0 pl-4 lg:pl-0' : ''
          }`"
        >
          <FormRadio
            v-for="option in TemperatureOptions"
            :key="option.id"
            v-model="data.temperatureUnit"
            class="w-36"
            :control-id="option.id"
            :group="option.group"
            :value="option.value"
          >
            {{ option.label }}
          </FormRadio>
        </div>
      </FormField>

      <FormField label="Weight" :responsive="responsive">
        <div
          :class="`flex flex-col gap-3 ${
            responsive ? 'md:flex-row md:gap-0 pl-4 lg:pl-0' : ''
          }`"
        >
          <FormRadio
            v-for="option in WeightOptions"
            :key="option.id"
            v-model="data.weightUnit"
            class="w-36"
            :control-id="option.id"
            :group="option.group"
            :value="option.value"
          >
            {{ option.label }}
          </FormRadio>
        </div>
      </FormField>

      <div class="flex flex-row justify-center items-baseline gap-3">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          data-testid="save-settings"
          submit
          @click="onSave"
        >
          Save Changes
        </FormButton>
        <FormButton data-testid="cancel-settings" @click="onReset">
          Cancel
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserSettingsDTO,
  WeightUnit,
} from '@bottomtime/api';

import { reactive, ref } from 'vue';

import { useClient } from '../../client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormRadio from '../common/form-radio.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

type EditSettingsProps = {
  responsive?: boolean;
  user: UserDTO;
};
type RadioOption = {
  id: string;
  group: string;
  value: string;
  label: string;
};

const DepthOptions: RadioOption[] = [
  {
    id: 'depth-meters',
    group: 'depth',
    value: DepthUnit.Meters,
    label: 'Meters (m)',
  },
  {
    id: 'depth-feet',
    group: 'depth',
    value: DepthUnit.Feet,
    label: 'Feet (ft)',
  },
];

const PressureOptions: RadioOption[] = [
  {
    id: 'pressure-bar',
    group: 'pressure',
    value: PressureUnit.Bar,
    label: 'Bar',
  },
  {
    id: 'pressure-psi',
    group: 'pressure',
    value: PressureUnit.PSI,
    label: 'PSI',
  },
];

const TemperatureOptions: RadioOption[] = [
  {
    id: 'temperature-celsius',
    group: 'temperature',
    value: TemperatureUnit.Celsius,
    label: 'Celsius (°C)',
  },
  {
    id: 'temperature-fahrenheit',
    group: 'temperature',
    value: TemperatureUnit.Fahrenheit,
    label: 'Fahrenheit (°F)',
  },
];

const WeightOptions: RadioOption[] = [
  {
    id: 'weight-kilograms',
    group: 'weight',
    value: WeightUnit.Kilograms,
    label: 'Kilograms (kg)',
  },
  {
    id: 'weight-pounds',
    group: 'weight',
    value: WeightUnit.Pounds,
    label: 'Pounds (lb)',
  },
];

const client = useClient();
const toasts = useToasts();
const oops = useOops();

const props = withDefaults(defineProps<EditSettingsProps>(), {
  responsive: true,
});
const data = reactive<UserSettingsDTO>({
  depthUnit: props.user.settings.depthUnit,
  pressureUnit: props.user.settings.pressureUnit,
  temperatureUnit: props.user.settings.temperatureUnit,
  weightUnit: props.user.settings.weightUnit,
});
const isSaving = ref(false);
const showConfirmResetDialog = ref(false);

function onAllMetric() {
  data.depthUnit = DepthUnit.Meters;
  data.pressureUnit = PressureUnit.Bar;
  data.temperatureUnit = TemperatureUnit.Celsius;
  data.weightUnit = WeightUnit.Kilograms;
}

function onAllImperial() {
  data.depthUnit = DepthUnit.Feet;
  data.pressureUnit = PressureUnit.PSI;
  data.temperatureUnit = TemperatureUnit.Fahrenheit;
  data.weightUnit = WeightUnit.Pounds;
}

const emit = defineEmits<{
  (e: 'save-settings', settings: UserSettingsDTO): void;
}>();

async function onSave(): Promise<void> {
  isSaving.value = true;

  await oops(async () => {
    const { settings } = client.users.wrapDTO(props.user);

    settings.depthUnit = data.depthUnit;
    settings.pressureUnit = data.pressureUnit;
    settings.temperatureUnit = data.temperatureUnit;
    settings.weightUnit = data.weightUnit;

    await settings.save();
    emit('save-settings', data);
    toasts.toast({
      id: 'settings-saved',
      message: 'Settings were successfully saved.',
      type: ToastType.Success,
    });
  });

  isSaving.value = false;
}

function onReset() {
  showConfirmResetDialog.value = true;
}

function onConfirmReset() {
  data.depthUnit = props.user.settings.depthUnit;
  data.pressureUnit = props.user.settings.pressureUnit;
  data.temperatureUnit = props.user.settings.temperatureUnit;
  data.weightUnit = props.user.settings.weightUnit;
  showConfirmResetDialog.value = false;
}

function onCancelReset() {
  showConfirmResetDialog.value = false;
}
</script>
