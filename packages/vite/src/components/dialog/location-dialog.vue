<template>
  <DialogBase
    :visible="visible"
    size="lg"
    :title="title"
    @close="$emit('cancel')"
  >
    <template #default>
      <div class="flex flex-col gap-6">
        <GoogleMap :location="gps" @location-changed="onLocationChanged" />

        <div class="flex gap-3 items-baseline">
          <FormLabel
            class="w-16 text-right"
            control-id="latitude"
            label="Lat"
            required
          />
          <FormTextBox
            v-model.number="currentLocation.lat"
            class="grow"
            control-id="latitude"
            :invalid="v$.lat.$error"
            :maxlength="10"
          />

          <FormLabel
            class="w-16 text-right"
            control-id="longitude"
            label="Lon"
            required
          />
          <FormTextBox
            v-model.number="currentLocation.lon"
            class="grow"
            control-id="longitude"
            :invalid="v$.lon.$error"
            :maxlength="10"
          />

          <div class="min-w-24 text-lg text-center">
            <FormButton type="link" @click="onClear"> Clear </FormButton>
          </div>
        </div>

        <ul v-if="v$.$error" class="text-danger list-disc list-outside ml-10">
          <li v-if="v$.lat.$error">{{ v$.lat.$errors[0].$message }}</li>
          <li v-if="v$.lon.$error">{{ v$.lon.$errors[0].$message }}</li>
        </ul>
      </div>
    </template>

    <template #buttons>
      <FormButton type="primary" @click="onSelect">Select Location</FormButton>
      <FormButton @click="$emit('cancel')">Cancel</FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { GpsCoordinates } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, maxValue, minValue, required } from '@vuelidate/validators';

import { computed, reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import FormTextBox from '../common/form-text-box.vue';
import GoogleMap from '../common/google-map.vue';
import DialogBase from './dialog-base.vue';

type LocationDialogProps = {
  location?: GpsCoordinates;
  title?: string;
  visible?: boolean;
};

withDefaults(defineProps<LocationDialogProps>(), {
  title: 'Select Location',
  visible: false,
});
const currentLocation = reactive<{
  lat: string | number;
  lon: string | number;
}>({
  lat: '',
  lon: '',
});
const gps = computed<GpsCoordinates | null>(() => {
  if (
    typeof currentLocation.lat === 'number' &&
    typeof currentLocation.lon === 'number'
  ) {
    return {
      lat: currentLocation.lat,
      lon: currentLocation.lon,
    };
  }

  return null;
});
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'confirm', location: GpsCoordinates): void;
}>();

const LatitudeError = 'Latitude must be a numeric value between -90.0 and 90.0';
const LongitudeError =
  'Longitude must be a numeric value between -180.0 and 180.0';
const v$ = useVuelidate(
  {
    lat: {
      required: helpers.withMessage('Latitude is required', required),
      minValue: helpers.withMessage(LatitudeError, minValue(-90)),
      maxValue: helpers.withMessage(LatitudeError, maxValue(90)),
    },
    lon: {
      required: helpers.withMessage('Longitude is required', required),
      minValue: helpers.withMessage(LongitudeError, minValue(-180)),
      maxValue: helpers.withMessage(LongitudeError, maxValue(180)),
    },
  },
  currentLocation,
);

function onLocationChanged(location: GpsCoordinates) {
  currentLocation.lat = location.lat;
  currentLocation.lon = location.lon;
}

function onClear() {
  currentLocation.lat = '';
  currentLocation.lon = '';
  v$.value.$reset();
}

async function onSelect() {
  const isValid = await v$.value.$validate();

  if (isValid && gps.value) {
    emit('confirm', gps.value);
  }
}

function reset() {
  onClear();
}

defineExpose({ reset });
</script>
