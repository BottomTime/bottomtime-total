<template>
  <form @submit.prevent="">
    <fieldset :disabled="isSaving">
      <div
        :class="`grid gap-3 ${
          responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`"
      >
        <FormField
          label="Name"
          control-id="name"
          :responsive="responsive"
          :invalid="v$.name.$error"
          :error="v$.name.$errors[0]?.$message"
          required
        >
          <FormTextBox
            v-model.trim="formData.name"
            control-id="name"
            test-id="name"
            :maxlength="100"
            :invalid="v$.name.$error"
            autofocus
          />
        </FormField>

        <FormField
          label="Material"
          control-id="material"
          :responsive="responsive"
          required
        >
          <div class="flex space-x-6 mt-1">
            <FormRadio
              v-model="formData.material"
              control-id="material-al"
              test-id="material-al"
              group="material"
              :value="TankMaterial.Aluminum"
            >
              Aluminum
            </FormRadio>
            <FormRadio
              v-model="formData.material"
              control-id="material-fe"
              test-id="material-fe"
              group="material"
              :value="TankMaterial.Steel"
            >
              Steel
            </FormRadio>
          </div>
        </FormField>

        <FormField
          label="Volume"
          control-id="volume"
          :responsive="responsive"
          :invalid="v$.volume.$error"
          :error="v$.volume.$errors[0]?.$message"
          required
        >
          <div class="relative">
            <FormTextBox
              v-model.number="formData.volume"
              control-id="volume"
              test-id="volume"
              :invalid="v$.volume.$error"
              :maxlength="10"
            />
            <span
              :class="`absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border dark:text-grey-200 ${
                v$.volume.$error
                  ? 'border-danger'
                  : 'border-grey-950 dark:bg-grey-700'
              } rounded-r-lg flex justify-center items-center w-10 pointer-events-none`"
            >
              L
            </span>
          </div>
        </FormField>

        <FormField
          label="Max Pressure"
          control-id="pressure"
          :responsive="responsive"
          :invalid="v$.workingPressure.$error"
          :error="v$.workingPressure.$errors[0]?.$message"
          required
        >
          <div class="relative">
            <FormTextBox
              v-model.number="formData.workingPressure"
              control-id="pressure"
              test-id="pressure"
              :invalid="v$.workingPressure.$error"
              :maxlength="10"
            />
            <span
              :class="`absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border dark:text-grey-200 ${
                v$.workingPressure.$error
                  ? 'border-danger'
                  : 'border-grey-950 dark:bg-grey-700'
              } rounded-r-lg flex justify-center items-center w-10 pointer-events-none`"
            >
              bar
            </span>
          </div>
          <p
            v-if="typeof formData.workingPressure === 'number'"
            class="text-sm mt-1.5"
          >
            ({{ (formData.workingPressure * 14.504).toFixed(0) }} psi)
          </p>
        </FormField>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3"
        data-testid="edit-tank-capacity"
      >
        <div
          v-if="capacity"
          :class="`col-start-1 ${
            responsive ? 'md:col-start-2 ' : 'md:col-span-3'
          } ml-2 px-4 py-2 border-l-4 text-grey-950 border-blue-400 bg-blue-300 dark:bg-blue-800 dark:text-grey-200 rounded-r-lg`"
        >
          <FormLabel label="Tank Capacity" />
          <div class="flex gap-3">
            <p>
              <span class="font-mono text-sm">
                {{ (capacity / 28.317).toFixed(1) }}
              </span>
              <span>ft</span>
              <sup>3</sup>
            </p>

            <p>/</p>

            <p>
              <span class="font-mono text-sm">{{ capacity.toFixed(1) }}</span>
              <span>L</span>
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 space-y-2">
        <div
          v-if="v$.$error"
          class="text-lg text-danger"
          data-testid="edit-tank-form-errors"
        >
          <p>
            There are errors in the form above. Please fix them and then try
            again.
          </p>
          <ul class="text-left list-inside list-disc italic">
            <li v-for="error in v$.$errors" :key="error.$uid">
              {{ error.$message }}
            </li>
          </ul>
        </div>

        <div class="text-center space-x-3">
          <FormButton
            type="primary"
            submit
            :is-loading="isSaving"
            control-id="save-tank"
            test-id="save-tank"
            @click="onSave"
          >
            Save Changes
          </FormButton>

          <FormButton
            v-if="showDelete"
            type="danger"
            control-id="delete-tank"
            test-id="delete-tank"
            @click="$emit('delete', props.tank)"
          >
            <p class="space-x-2">
              <span>
                <i class="fas fa-trash-alt"></i>
              </span>
              <span>Delete</span>
            </p>
          </FormButton>
        </div>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { TankDTO, TankMaterial } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { between, helpers, required } from '@vuelidate/validators';

import { computed, reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormLabel from '../common/form-label.vue';
import FormRadio from '../common/form-radio.vue';
import FormTextBox from '../common/form-text-box.vue';

interface EditTankProps {
  tank: TankDTO;
  isSaving?: boolean;
  responsive?: boolean;
  showDelete?: boolean;
}

interface EditTankFormData {
  name: string;
  material: TankMaterial;
  volume: number | string;
  workingPressure: number | string;
}

const props = withDefaults(defineProps<EditTankProps>(), {
  isSaving: false,
  responsive: true,
  showDelete: false,
});
const emit = defineEmits<{
  (e: 'save', dto: TankDTO): void;
  (e: 'delete', tank: TankDTO): void;
}>();

const formData = reactive<EditTankFormData>({
  name: props.tank.name,
  material: props.tank.material,
  volume: props.tank.volume || '',
  workingPressure: props.tank.workingPressure || '',
});
const capacity = computed(() =>
  typeof formData.volume === 'number' &&
  typeof formData.workingPressure === 'number'
    ? (formData.volume * formData.workingPressure) / 1.01325
    : 0,
);

const v$ = useVuelidate(
  {
    name: {
      required: helpers.withMessage(
        'Name of tank profile is required',
        required,
      ),
    },
    volume: {
      required: helpers.withMessage('Volume is required', required),
      between: helpers.withMessage(
        'Volume must be between 1 and 30 litres',
        between(1, 30),
      ),
    },
    workingPressure: {
      required: helpers.withMessage('Max pressure is required', required),
      between: helpers.withMessage(
        'Max pressure must be between 100 and 300 bar',
        between(100, 300),
      ),
    },
  },
  formData,
);

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  emit('save', {
    ...props.tank,
    name: formData.name,
    material: formData.material,
    volume: formData.volume as number,
    workingPressure: formData.workingPressure as number,
  });
}
</script>
