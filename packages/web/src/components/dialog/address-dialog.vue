<template>
  <DialogBase
    :visible="visible"
    :title="title"
    size="lg"
    @close="$emit('cancel')"
  >
    <template #default>
      <FormField
        label="Address"
        :responsive="false"
        required
        :invalid="v$.address.$error"
        :error="v$.address.$errors[0]?.$message"
      >
        <PlacesAutoComplete
          ref="addressInput"
          v-model="formData.address"
          autofocus
          control-id="address"
          test-id="address"
          :maxlength="500"
          :invalid="v$.address.$error"
          @place-changed="onPlaceChanged"
        />
      </FormField>

      <FormField :responsive="false">
        <GoogleMap
          :center="gps ?? undefined"
          :marker="mapGPS"
          @click="onMapClicked"
        />
      </FormField>

      <div class="grid grid-cols-2 gap-3">
        <FormField
          label="Latitude"
          required
          :responsive="false"
          :invalid="v$.gps.lat.$error"
          :error="v$.gps.lat.$errors[0]?.$message"
        >
          <FormTextBox
            v-model.number="formData.gps.lat"
            :invalid="v$.gps.lat.$error"
            :maxlength="15"
          />
        </FormField>

        <FormField
          label="Longitude"
          required
          :responsive="false"
          :invalid="v$.gps.lon.$error"
          :error="v$.gps.lon.$errors[0]?.$message"
        >
          <FormTextBox
            v-model.number="formData.gps.lon"
            :invalid="v$.gps.lon.$error"
            :maxlength="15"
          />
        </FormField>
      </div>
    </template>

    <template #buttons>
      <FormButton type="primary" submit @click="onSave">Save</FormButton>
      <FormButton @click="$emit('cancel')">Cancel</FormButton>
    </template>
  </DialogBase>
</template>

<script lang="ts" setup>
import { GPSCoordinates } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { between, helpers, required } from '@vuelidate/validators';

import { computed, reactive, ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import GoogleMap from '../common/google-map.vue';
import PlacesAutoComplete from '../common/places-auto-complete.vue';
import DialogBase from './dialog-base.vue';

interface AddressDialogProps {
  address?: string;
  gps?: GPSCoordinates | null;
  title?: string;
  visible?: boolean;
}

interface AddressDialogFormState {
  address: string;
  gps: {
    lat: string | number;
    lon: string | number;
  };
}

const addressInput = ref<InstanceType<typeof PlacesAutoComplete> | null>(null);
const props = withDefaults(defineProps<AddressDialogProps>(), {
  address: '',
  coordinates: null,
  title: 'Select Address',
  visible: false,
});

const formData = reactive<AddressDialogFormState>({
  address: props.address,
  gps: {
    lat: props.gps?.lat ?? '',
    lon: props.gps?.lon ?? '',
  },
});

const mapGPS = computed<GPSCoordinates | undefined>(() => {
  if (
    typeof formData.gps.lat === 'number' &&
    typeof formData.gps.lon === 'number' &&
    formData.gps.lat >= -90 &&
    formData.gps.lat <= 90 &&
    formData.gps.lon >= -180 &&
    formData.gps.lon <= 180
  ) {
    return {
      lat: formData.gps.lat,
      lon: formData.gps.lon,
    };
  }

  return undefined;
});

const v$ = useVuelidate(
  {
    address: {
      required: helpers.withMessage('Address is required', required),
    },
    gps: {
      lat: {
        required: helpers.withMessage('Latitude is required', required),
        latitude: helpers.withMessage(
          'Latitude must be a number between -90 and 90',
          between(-90, 90),
        ),
      },
      lon: {
        required: helpers.withMessage('Longitude is required', required),
        longitude: helpers.withMessage(
          'Longitude must be a number between -180 and 180',
          between(-180, 180),
        ),
      },
    },
  },
  formData,
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'save', address: string, coordinates: GPSCoordinates | null): void;
}>();

function reset() {
  formData.address = props.address;
  formData.gps.lat = props.gps?.lat ?? '';
  formData.gps.lon = props.gps?.lon ?? '';
  v$.value.$reset();
  addressInput.value?.focus();
}

function onPlaceChanged(coordinates?: GPSCoordinates) {
  if (coordinates) {
    formData.gps.lat = coordinates.lat;
    formData.gps.lon = coordinates.lon;
  }
}

function onMapClicked(coordinates?: GPSCoordinates) {
  if (coordinates) {
    formData.gps.lat = coordinates.lat;
    formData.gps.lon = coordinates.lon;
  }
}

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  emit('save', formData.address, {
    lat: formData.gps.lat as number,
    lon: formData.gps.lon as number,
  });
}

defineExpose({
  reset,
});
</script>
