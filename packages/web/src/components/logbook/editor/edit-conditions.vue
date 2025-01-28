<template>
  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700 to-blue-500 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Conditions</TextHeading>

    <FormField label="Weather" control-id="weather">
      <FormSelect
        v-model="formData.weather"
        control-id="weather"
        test-id="weather"
        :options="WeatherOptions"
        stretch
      />
    </FormField>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
      <FormField
        label="Air Temperature"
        control-id="airTemp"
        :invalid="v$.airTemp.$error"
        :error="v$.airTemp.$errors[0]?.$message"
      >
        <TemperatureInput
          v-model.number="formData.airTemp"
          control-id="airTemp"
          test-id="air-temp"
          :unit="formData.tempUnit"
          :invalid="v$.airTemp.$error"
          @toggle-unit="onToggleTempUnit"
        />
      </FormField>

      <FormField
        label="Water Temperature"
        control-id="waterTemp"
        :invalid="v$.waterTemp.$error"
        :error="v$.waterTemp.$errors[0]?.$message"
      >
        <TemperatureInput
          v-model.number="formData.waterTemp"
          control-id="waterTemp"
          test-id="water-temp"
          :unit="formData.tempUnit"
          :invalid="v$.waterTemp.$error"
          @toggle-unit="onToggleTempUnit"
        />
      </FormField>

      <FormField
        label="Thermocline"
        control-id="thermocline"
        :invalid="v$.thermocline.$error"
        :error="v$.thermocline.$errors[0]?.$message"
      >
        <TemperatureInput
          v-model.number="formData.thermocline"
          control-id="thermocline"
          test-id="thermocline"
          :unit="formData.tempUnit"
          :invalid="v$.thermocline.$error"
          @toggle-unit="onToggleTempUnit"
        />
      </FormField>
    </div>

    <FormField label="Current">
      <div class="flex gap-2 items-center">
        <FormSlider
          v-model="formData.current"
          control-id="current"
          test-id="current"
          :min="0"
          :show-value="false"
        />
        <span class="min-w-24">{{ currentText }}</span>
      </div>
    </FormField>

    <FormField label="Visibility">
      <div class="flex gap-2 items-center">
        <FormSlider
          v-model="formData.visibility"
          control-id="visibility"
          test-id="visibility"
          :min="0"
          :show-value="false"
        />
        <span class="min-w-24">{{ visibilityText }}</span>
      </div>
    </FormField>

    <FormField label="Chop">
      <div class="flex gap-2 items-center">
        <FormSlider
          v-model="formData.chop"
          control-id="chop"
          test-id="chop"
          :min="0"
          :show-value="false"
        />
        <span class="min-w-24">{{ chopText }}</span>
      </div>
    </FormField>
  </section>
</template>

<script lang="ts" setup>
import { TemperatureUnit } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers } from '@vuelidate/validators';

import { computed } from 'vue';

import { SelectOption } from '../../../common';
import { airTemperature, waterTemperature } from '../../../validators';
import FormField from '../../common/form-field.vue';
import FormSelect from '../../common/form-select.vue';
import FormSlider from '../../common/form-slider.vue';
import TemperatureInput from '../../common/temperature-input.vue';
import TextHeading from '../../common/text-heading.vue';
import { LogEntryConditions } from './types';

const WeatherOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: '☀️ Sunny', value: 'Sunny' },
  { label: '🌤️ Partly cloudy', value: 'Partly cloudy' },
  { label: '☁️ Overcast', value: 'Overcast' },
  { label: '🌧️ Raining', value: 'Light rain' },
  { label: '⛈️ Stormy', value: 'Stormy' },
  { label: '🌨️ Snowing', value: 'Snowing' },
];

const formData = defineModel<LogEntryConditions>({ required: true });

const currentText = computed(() => {
  const value = Math.round(formData.value.current);

  if (value === 1) return 'None';
  if (value === 2) return 'Light';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'Strong';
  if (value === 5) return 'Extreme';

  return 'Unspecified';
});

const visibilityText = computed(() => {
  const value = Math.round(formData.value.visibility);

  if (value === 1) return 'Nil';
  if (value === 2) return 'Poor';
  if (value === 3) return 'Fair';
  if (value === 4) return 'Good';
  if (value === 5) return 'Excellent';

  return 'Unspecified';
});

const chopText = computed(() => {
  const value = Math.round(formData.value.chop ?? 0);

  if (value === 1) return 'Calm';
  if (value === 2) return 'Light';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'Heavy';
  if (value === 5) return 'Severe';

  return 'Unspecified';
});

const v$ = useVuelidate<LogEntryConditions>(
  {
    airTemp: {
      valid: helpers.withMessage(
        'Air temperature must be between -50 and 60°C (-58 and 140°F)',
        (val, { tempUnit }) =>
          !helpers.req(val) ||
          airTemperature({ temperature: val, unit: tempUnit }),
      ),
    },
    waterTemp: {
      valid: helpers.withMessage(
        'Water temperature must be between -2 and 60°C (28 and 140°F)',
        (val, { tempUnit }) =>
          !helpers.req(val) ||
          waterTemperature({
            temperature: val,
            unit: tempUnit,
          }),
      ),
    },
    thermocline: {
      valid: helpers.withMessage(
        'Thermocline temperature must be between -2 and 60°C (28 and 140°F)',
        (val, { tempUnit }) =>
          !helpers.req(val) ||
          waterTemperature({
            temperature: val,
            unit: tempUnit,
          }),
      ),
    },
  },
  formData,
);

function onToggleTempUnit(newUnit: TemperatureUnit) {
  formData.value.tempUnit = newUnit;
}
</script>
