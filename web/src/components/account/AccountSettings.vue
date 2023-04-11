<template>
  <form id="form-account-settings">
    <h1 class="title is-size-4">Preferred Units</h1>

    <HorizontalFormField label="Depth" required>
      <RadioGroup
        id="depthUnit"
        :options="DepthUnitOptions"
        v-model="data.depthUnit"
      />
    </HorizontalFormField>

    <HorizontalFormField label="Pressure" required>
      <RadioGroup
        id="pressureUnit"
        :options="PressureUnitOptions"
        v-model="data.pressureUnit"
      />
    </HorizontalFormField>

    <HorizontalFormField label="Temperature" required>
      <RadioGroup
        id="temperatureUnit"
        :options="TemperatureUnitOptions"
        v-model="data.temperatureUnit"
      />
    </HorizontalFormField>

    <HorizontalFormField label="Weight" required>
      <RadioGroup
        id="weightUnit"
        :options="WeightUnitOptions"
        v-model="data.weightUnit"
      />
    </HorizontalFormField>
  </form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

import {
  DepthUnitOptions,
  PressureUnitOptions,
  TemperatureUnitOptions,
  WeightUnitOptions,
} from '@/units';
import HorizontalFormField from '@/components/forms/HorizontalFormField.vue';
import RadioGroup from '../forms/RadioGroup.vue';

interface AccountSettingsData {
  depthUnit: string;
  pressureUnit: string;
  temperatureUnit: string;
  weightUnit: string;
}

const data = reactive<AccountSettingsData>({
  depthUnit: '',
  pressureUnit: '',
  temperatureUnit: '',
  weightUnit: '',
});
</script>
