<template>
  <FormBox class="space-y-2">
    <FormField label="Tank" :responsive="false">
      <FormSelect
        v-model="formData.tankId"
        control-id="tanks-select"
        :options="tankOptions"
      />
    </FormField>

    <div class="flex gap-3 items-baseline">
      <FormField
        label="Start Pressure"
        control-id="start-pressure"
        :responsive="false"
      >
        <div class="relative">
          <FormTextBox v-model.number="formData.startPressure" />
          <button
            class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
            @click="onTogglePressureUnit"
          >
            {{ formData.pressureUnit }}
          </button>
        </div>
      </FormField>

      <FormField
        label="End Pressure"
        control-id="end-pressure"
        :responsive="false"
      >
        <div class="relative">
          <FormTextBox v-model.number="formData.endPressure" />
          <button
            class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
            @click="onTogglePressureUnit"
          >
            {{ formData.pressureUnit }}
          </button>
        </div>
      </FormField>
    </div>

    <div class="flex gap-3 items-baseline">
      <FormField label="O₂ %" control-id="o2" :responsive="false">
        <div class="relative">
          <FormTextBox v-model.number="formData.o2Percentage" />
          <span
            class="absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border border-grey-950 dark:text-grey-200 dark:bg-grey-700 rounded-r-lg flex justify-center items-center w-10 pointer-events-none"
          >
            %
          </span>
        </div>
      </FormField>

      <FormField label="He %" control-id="he" :responsive="false">
        <div class="relative">
          <FormTextBox v-model.number="formData.hePercentage" />
          <span
            class="absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border border-grey-950 dark:text-grey-200 dark:bg-grey-700 rounded-r-lg flex justify-center items-center w-10 pointer-events-none"
          >
            %
          </span>
        </div>
      </FormField>
    </div>

    <p>{{ formData }}</p>
  </FormBox>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { SelectOption } from '../../common';
import FormBox from '../common/form-box.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';

interface EditEntryAirProps {
  tanks: TankDTO[];
}

interface EditEntryAirFormData {
  tankId: string;
  startPressure: string | number;
  endPressure: string | number;
  pressureUnit: PressureUnit;
  hePercentage: string | number;
  o2Percentage: string | number;
}

const props = defineProps<EditEntryAirProps>();
const tankOptions = computed<SelectOption[]>(() => [
  { value: '', label: '(select tank)' },
  ...props.tanks.map((tank) => ({
    value: tank.id,
    label: tank.name,
  })),
]);

const formData = reactive<EditEntryAirFormData>({
  startPressure: '',
  endPressure: '',
  pressureUnit: PressureUnit.Bar,
  hePercentage: '',
  o2Percentage: '',
  tankId: '',
});

function onTogglePressureUnit() {
  formData.pressureUnit =
    formData.pressureUnit === PressureUnit.Bar
      ? PressureUnit.PSI
      : PressureUnit.Bar;
}
</script>
