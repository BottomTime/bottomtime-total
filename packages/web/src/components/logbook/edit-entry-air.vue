<template>
  <li class="my-1.5">
    <div class="flex justify-between">
      <TextHeading level="h4">#{{ ordinal + 1 }}</TextHeading>

      <button class="text-danger" @click="$emit('remove', ordinal)">
        <span class="sr-only">Remove air entry #{{ ordinal + 1 }}</span>
        <span>
          <i class="fa-solid fa-x"></i>
        </span>
      </button>
    </div>

    <FormBox class="grid grid-cols-2 lg:grid-cols-4 gap-2 ml-4">
      <FormField
        class="order-1 col-span-1 lg:col-span-3"
        label="Tank"
        :responsive="false"
        :invalid="v$.tankId.$error"
        :error="v$.tankId.$errors[0]?.$message"
      >
        <FormSelect
          v-model="formData.tankId"
          control-id="tanks-select"
          :options="tankOptions"
          :invalid="v$.tankId.$error"
          stretch
        />
      </FormField>

      <div
        v-if="formData.tankInfo"
        class="flex justify-evenly col-span-2 lg:col-span-4 order-3 mb-2"
      >
        <div class="text-center">
          <p class="font-bold">Working Pressure</p>
          <p class="font-mono text-sm">
            {{ formData.tankInfo.workingPressure }}bar
          </p>
        </div>
        <div class="text-center">
          <p class="font-bold">Volume</p>
          <p class="font-mono text-sm">{{ formData.tankInfo.volume }}L</p>
        </div>
        <div class="text-center">
          <p class="font-bold">Material</p>
          <p class="font-mono text-sm">
            {{ tankMaterialString }}
          </p>
        </div>
      </div>

      <FormField
        class="order-2"
        label="Count"
        :responsive="false"
        :invalid="v$.count.$error"
        :error="v$.count.$errors[0]?.$message"
      >
        <FormTextBox v-model.number="formData.count" />
      </FormField>

      <FormField
        class="order-4"
        label="Start Pressure"
        control-id="start-pressure"
        :invalid="v$.startPressure.$error"
        :error="v$.startPressure.$errors[0]?.$message"
        :responsive="false"
      >
        <div class="relative">
          <FormTextBox
            v-model.number="formData.startPressure"
            :invalid="v$.startPressure.$error"
          />
          <button
            :class="`absolute inset-y-0 end-0 rounded-r-lg border ${
              v$.startPressure.$error ? 'border-danger' : 'border-grey-950 '
            } w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover`"
            @click="onTogglePressureUnit"
          >
            {{ formData.pressureUnit }}
          </button>
        </div>
      </FormField>

      <FormField
        class="order-5"
        label="End Pressure"
        control-id="end-pressure"
        :responsive="false"
        :invalid="v$.endPressure.$error"
        :error="v$.endPressure.$errors[0]?.$message"
      >
        <div class="relative">
          <FormTextBox
            v-model.number="formData.endPressure"
            :invalid="v$.endPressure.$error"
          />
          <button
            :class="`absolute inset-y-0 end-0 rounded-r-lg border ${
              v$.endPressure.$error ? 'border-danger' : 'border-grey-950'
            } w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover`"
            @click="onTogglePressureUnit"
          >
            {{ formData.pressureUnit }}
          </button>
        </div>
      </FormField>

      <FormField
        class="order-6"
        label="O₂ %"
        control-id="o2"
        :responsive="false"
        :invalid="v$.o2Percentage.$error"
        :error="v$.o2Percentage.$errors[0]?.$message"
      >
        <div class="relative">
          <FormTextBox
            v-model.number="formData.o2Percentage"
            :invalid="v$.o2Percentage.$error"
          />
          <span
            :class="`absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border dark:text-grey-200 ${
              v$.o2Percentage.$error
                ? 'border-danger'
                : 'border-grey-950 dark:bg-grey-700'
            } rounded-r-lg flex justify-center items-center w-10 pointer-events-none`"
          >
            %
          </span>
        </div>
      </FormField>

      <FormField
        class="order-7"
        label="He %"
        control-id="he"
        :responsive="false"
        :invalid="v$.hePercentage.$error"
        :error="v$.hePercentage.$errors[0]?.$message"
      >
        <div class="relative">
          <FormTextBox
            v-model.number="formData.hePercentage"
            :invalid="v$.hePercentage.$error"
          />
          <span
            :class="`absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border dark:text-grey-200 ${
              v$.hePercentage.$error
                ? 'border-danger'
                : 'border-grey-950 dark:bg-grey-700'
            } rounded-r-lg flex justify-center items-center w-10 pointer-events-none`"
          >
            %
          </span>
        </div>
      </FormField>
    </FormBox>
  </li>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO, TankMaterial } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { between, helpers, integer, required } from '@vuelidate/validators';

import { computed, reactive, watch } from 'vue';

import { SelectOption } from '../../common';
import FormBox from '../common/form-box.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import TextHeading from '../common/text-heading.vue';
import { EditEntryAirFormData } from './edit-entry-air-form-data';

interface EditEntryAirProps {
  air: EditEntryAirFormData;
  ordinal: number;
  tanks: TankDTO[];
}

const props = defineProps<EditEntryAirProps>();
const emit = defineEmits<{
  (e: 'remove', index: number): void;
  (e: 'update', air: EditEntryAirFormData, index: number): void;
}>();

const tankOptions = computed<SelectOption[]>(() => [
  { value: '', label: '(select tank)' },
  ...props.tanks.map((tank) => ({
    value: tank.id,
    label: tank.name,
  })),
]);

const formData = reactive<EditEntryAirFormData>({ ...props.air });

const tankMaterialString = computed(() => {
  if (!formData.tankInfo) return '';
  return formData.tankInfo.material === TankMaterial.Aluminum
    ? 'Aluminum'
    : 'Steel';
});

const v$ = useVuelidate(
  {
    tankId: {
      required: helpers.withMessage('Please select a tank', required),
    },
    count: {
      int: helpers.withMessage(
        'Number of tanks must be a whole number (e.g. 1, 2, 3, etc.)',
        integer,
      ),
      between: helpers.withMessage(
        'Number of tanks must be between 1 and 4',
        between(1, 4),
      ),
    },
    startPressure: {
      required: helpers.withMessage('Start pressure is required', required),
      valid: helpers.withMessage(
        'Start pressure must be greater than 0 and less than 300bar / 4400psi',
        (startPressure, { pressureUnit }) => {
          if (!helpers.req(startPressure)) return true;
          if (typeof startPressure !== 'number') return false;
          return (
            startPressure > 0 &&
            startPressure <= (pressureUnit === PressureUnit.Bar ? 300 : 4400)
          );
        },
      ),
    },
    endPressure: {
      required: helpers.withMessage('End pressure is required', required),
      valid: helpers.withMessage(
        'End pressure must be greater than 0 and cannot be greater than the start pressure',
        (endPressure, { startPressure }) => {
          if (!helpers.req(endPressure)) return true;
          if (typeof endPressure !== 'number') return false;
          return endPressure > 0 && endPressure < startPressure;
        },
      ),
    },
    o2Percentage: {
      between: helpers.withMessage(
        'O₂ percentage must be between 0 and 100',
        between(0, 100),
      ),
      gasMixLimits: helpers.withMessage(
        'O₂ and helium content cannot add to more than 100% of the gas mix',
        (o2Percentage, { hePercentage }) => {
          if (
            typeof o2Percentage === 'number' &&
            typeof hePercentage === 'number'
          ) {
            return o2Percentage + hePercentage <= 100;
          }

          return true;
        },
      ),
    },
    hePercentage: {
      between: helpers.withMessage(
        'Helium percentage must be between 0 and 100',
        between(0, 100),
      ),
    },
  },
  formData,
);

function onTogglePressureUnit() {
  formData.pressureUnit =
    formData.pressureUnit === PressureUnit.Bar
      ? PressureUnit.PSI
      : PressureUnit.Bar;
}

watch(formData, (newData, oldData) => {
  // if (newData.tankId !== oldData.tankId) {
  newData.tankInfo = props.tanks.find((tank) => tank.id === newData.tankId);
  // }
  emit('update', newData, props.ordinal);
});
</script>
