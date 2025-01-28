<template>
  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700 to-blue-500 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Equipment</TextHeading>

    <FormField
      label="Weight"
      control-id="weight"
      :invalid="v$.weight.$error"
      :error="v$.weight.$errors[0]?.$message"
    >
      <WeightInput
        v-model="formData.weight"
        :unit="formData.weightUnit"
        control-id="weight"
        test-id="weight"
        :invalid="v$.weight.$error"
        @toggle-unit="onToggleWeightUnit"
      />
    </FormField>

    <div class="flex flex-col md:flex-row gap-2 justify-between">
      <FormField label="Weight Accuracy" control-id="weightCorrectness">
        <FormSelect
          v-model="formData.weightCorrectness"
          control-id="weightCorrectness"
          test-id="weight-correctness"
          :options="WeightAccuracyOptions"
        />
      </FormField>

      <FormField label="Trim" control-id="trim">
        <FormSelect
          v-model="formData.trim"
          control-id="trim"
          test-id="trim"
          :options="TrimOptions"
        />
      </FormField>
    </div>

    <FormField label="Exposure Suit" control-id="exposureSuit">
      <FormSelect
        v-model="formData.exposureSuit"
        control-id="exposureSuit"
        test-id="exposureSuit"
        :options="ExposureSuitOptions"
        stretch
      />
    </FormField>

    <FormField label="Other Equipment:">
      <div class="grid grid-cols-2">
        <FormCheckbox
          v-model="formData.boots"
          control-id="boots"
          test-id="boots"
        >
          Boots
        </FormCheckbox>
        <FormCheckbox
          v-model="formData.camera"
          control-id="camera"
          test-id="camera"
        >
          Camera
        </FormCheckbox>
        <FormCheckbox v-model="formData.hood" control-id="hood" test-id="hood">
          Hood
        </FormCheckbox>
        <FormCheckbox
          v-model="formData.gloves"
          control-id="gloves"
          test-id="gloves"
        >
          Gloves
        </FormCheckbox>
        <FormCheckbox
          v-model="formData.scooter"
          control-id="scooter"
          test-id="scooter"
        >
          Scooter
        </FormCheckbox>
        <FormCheckbox
          v-model="formData.torch"
          control-id="torch"
          test-id="torch"
        >
          Torch
        </FormCheckbox>
      </div>
    </FormField>
  </section>
</template>

<script lang="ts" setup>
import {
  ExposureSuit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers } from '@vuelidate/validators';

import { SelectOption } from '../../../common';
import { weight } from '../../../validators';
import FormCheckbox from '../../common/form-checkbox.vue';
import FormField from '../../common/form-field.vue';
import FormSelect from '../../common/form-select.vue';
import TextHeading from '../../common/text-heading.vue';
import WeightInput from '../../common/weight-input.vue';
import { LogEntryEquipment } from './types';

const WeightAccuracyOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: 'Good', value: WeightCorrectness.Good },
  { label: 'Too much', value: WeightCorrectness.Over },
  { label: 'Too little', value: WeightCorrectness.Under },
];

const TrimOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: 'Good', value: TrimCorrectness.Good },
  { label: 'Head down', value: TrimCorrectness.HeadDown },
  { label: 'Knees down', value: TrimCorrectness.KneesDown },
];

const ExposureSuitOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: 'None', value: ExposureSuit.None },
  { label: 'Shorty', value: ExposureSuit.Shorty },
  { label: 'Rashguard', value: ExposureSuit.Rashguard },
  { label: 'Wetsuit (3mm)', value: ExposureSuit.Wetsuit3mm },
  { label: 'Wetsuit (5mm)', value: ExposureSuit.Wetsuit5mm },
  { label: 'Wetsuit (7mm)', value: ExposureSuit.Wetsuit7mm },
  { label: 'Wetsuit (9mm)', value: ExposureSuit.Wetsuit9mm },
  { label: 'Drysuit', value: ExposureSuit.Drysuit },
  { label: 'Other', value: ExposureSuit.Other },
];

const formData = defineModel<LogEntryEquipment>({ required: true });

const v$ = useVuelidate<LogEntryEquipment>(
  {
    weight: {
      valid: helpers.withMessage(
        'Weight must be numeric and cannot be less than zero',
        (val) =>
          !helpers.req(val) ||
          weight({ weight: val, unit: formData.value.weightUnit }),
      ),
    },
  },
  formData,
);

function onToggleWeightUnit(newUnit: WeightUnit) {
  formData.value.weightUnit = newUnit;
}
</script>
