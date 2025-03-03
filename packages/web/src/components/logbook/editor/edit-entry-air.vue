<template>
  <li class="flex flex-col gap-1">
    <div class="flex items-center justify-between">
      <p class="text-2xl">#{{ ordinal + 1 }}</p>
      <CloseButton
        class="min-w-6"
        :test-id="`remove-tank-${ordinal}`"
        dangerous
        @close="$emit('remove', formData.id)"
      />
    </div>

    <FormField
      label="Tank"
      :control-id="`tanks-select-${ordinal}`"
      :responsive="false"
      :invalid="v$.tankId.$error"
      :error="v$.tankId.$errors[0]?.$message"
    >
      <div class="flex flex-col lg:flex-row items-baseline gap-1 lg:gap-3">
        <FormSelect
          v-model="formData.tankId"
          class="grow"
          :control-id="`tanks-select-${ordinal}`"
          :test-id="`tanks-select-${ordinal}`"
          :options="tankOptions"
          :invalid="v$.tankId.$error"
          stretch
        />

        <FormCheckbox
          v-model="formData.doubles"
          :control-id="`doubles-${ordinal}`"
          test-id="doubles"
          class="mx-3"
        >
          Doubles
        </FormCheckbox>
      </div>
    </FormField>

    <div
      v-if="formData.tankInfo"
      class="flex justify-evenly text-sm"
      data-testid="tank-summary"
    >
      <div class="text-center">
        <label class="font-bold">Working Pressure</label>
        <p class="text-xs font-mono">
          <PressureText
            :pressure="formData.tankInfo.workingPressure"
            :unit="PressureUnit.Bar"
          />
        </p>
      </div>
      <div class="text-center">
        <p class="font-bold">Volume</p>
        <p class="font-mono text-xs">{{ formData.tankInfo.volume }}L</p>
      </div>
      <div class="text-center">
        <p class="font-bold">Material</p>
        <p class="font-mono text-xs">
          {{ tankMaterialString }}
        </p>
      </div>
    </div>

    <div class="flex flex-col xl:flex-row gap-0 xl:gap-2">
      <div class="flex justify-between gap-2">
        <FormField
          label="Start Pressure"
          :control-id="`start-pressure-${ordinal}`"
          :invalid="v$.startPressure.$error"
          :error="v$.startPressure.$errors[0]?.$message"
          :responsive="false"
        >
          <PressureInput
            v-model.number="formData.startPressure"
            :unit="formData.pressureUnit"
            :control-id="`start-pressure-${ordinal}`"
            :test-id="`start-pressure-${ordinal}`"
            :invalid="v$.startPressure.$error"
            @toggle-unit="onTogglePressureUnit"
          />
        </FormField>

        <FormField
          label="End Pressure"
          :control-id="`end-pressure-${ordinal}`"
          :responsive="false"
          :invalid="v$.endPressure.$error"
          :error="v$.endPressure.$errors[0]?.$message"
        >
          <PressureInput
            v-model.number="formData.endPressure"
            :unit="formData.pressureUnit"
            :control-id="`end-pressure-${ordinal}`"
            :test-id="`end-pressure-${ordinal}`"
            :invalid="v$.endPressure.$error"
            @toggle-unit="onTogglePressureUnit"
          />
        </FormField>
      </div>

      <div class="flex justify-between gap-2">
        <FormField
          label="O₂ %"
          :control-id="`o2-${ordinal}`"
          :responsive="false"
          :invalid="v$.o2Percent.$error"
          :error="v$.o2Percent.$errors[0]?.$message"
        >
          <div class="relative">
            <FormTextBox
              v-model.number="formData.o2Percent"
              :control-id="`o2-${ordinal}`"
              :test-id="`o2-${ordinal}`"
              :invalid="v$.o2Percent.$error"
            />
            <span
              :class="`absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border dark:text-grey-200 ${
                v$.o2Percent.$error
                  ? 'border-danger'
                  : 'border-grey-950 dark:bg-grey-700'
              } rounded-r-lg flex justify-center items-center w-10 pointer-events-none`"
            >
              %
            </span>
          </div>
        </FormField>

        <FormField
          label="He %"
          :control-id="`he-${ordinal}`"
          :responsive="false"
          :invalid="v$.hePercent.$error"
          :error="v$.hePercent.$errors[0]?.$message"
        >
          <div class="relative">
            <FormTextBox
              v-model.number="formData.hePercent"
              :control-id="`he-${ordinal}`"
              :test-id="`he-${ordinal}`"
              :invalid="v$.hePercent.$error"
            />
            <span
              :class="`absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border dark:text-grey-200 ${
                v$.hePercent.$error
                  ? 'border-danger'
                  : 'border-grey-950 dark:bg-grey-700'
              } rounded-r-lg flex justify-center items-center w-10 pointer-events-none`"
            >
              %
            </span>
          </div>
        </FormField>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO, TankMaterial } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { between, helpers, required } from '@vuelidate/validators';

import { computed, reactive, watch } from 'vue';

import { SelectOption } from '../../../common';
import CloseButton from '../../common/close-button.vue';
import FormCheckbox from '../../common/form-checkbox.vue';
import FormField from '../../common/form-field.vue';
import FormSelect from '../../common/form-select.vue';
import FormTextBox from '../../common/form-text-box.vue';
import PressureInput from '../../common/pressure-input.vue';
import PressureText from '../../common/pressure-text.vue';
import { LogEntryAir } from './types';

interface EditEntryAirProps {
  air: LogEntryAir;
  ordinal: number;
  tanks: TankDTO[];
}

const props = defineProps<EditEntryAirProps>();
const emit = defineEmits<{
  (e: 'remove', id: string): void;
  (e: 'update', air: LogEntryAir): void;
}>();

const tankOptions = computed<SelectOption[]>(() => [
  props.air.tankId === '' && props.air.tankInfo
    ? { value: 'current', label: props.air.tankInfo.name }
    : { value: '', label: '(select tank)' },
  ...props.tanks.map((tank) => ({
    value: tank.id,
    label: tank.name,
  })),
]);

const formData = reactive<LogEntryAir>({
  ...props.air,
  tankId: props.air.tankId || (props.air.tankInfo ? 'current' : ''),
});

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
    o2Percent: {
      between: helpers.withMessage(
        'O₂ percentage must be between 0 and 100',
        between(0, 100),
      ),
      gasMixLimits: helpers.withMessage(
        'O₂ and helium content cannot add to more than 100% of the gas mix',
        (o2Percent, { hePercent }) => {
          if (typeof o2Percent === 'number' && typeof hePercent === 'number') {
            return o2Percent + hePercent <= 100;
          }

          return true;
        },
      ),
    },
    hePercent: {
      between: helpers.withMessage(
        'Helium percentage must be between 0 and 100',
        between(0, 100),
      ),
    },
  },
  formData,
);

function onTogglePressureUnit(newUnit: PressureUnit) {
  formData.pressureUnit = newUnit;
}

watch(formData, (newData) => {
  newData.tankInfo = props.tanks.find((tank) => tank.id === newData.tankId);
  emit('update', newData);
});
</script>
