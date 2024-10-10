<template>
  <LocationDialog
    ref="locationDialog"
    :visible="state.showLocationDialog"
    :location="value ?? undefined"
    @cancel="onCancelSelectLocation"
    @confirm="onConfirmSelectLocation"
  />

  <div v-if="value" class="text-sm mb-2">
    <p class="space-x-2">
      <span class="text-danger">
        <i class="fa-solid fa-map-marker-alt fa-fw"></i>
      </span>
      <label class="font-bold">Coordinates</label>
    </p>

    <p class="ml-6">
      <span> {{ value.lat }}, {{ value.lon }} </span>
    </p>

    <template v-if="showRadius">
      <p class="space-x-2">
        <span>
          <i class="fa-solid fa-ruler-horizontal fa-fw"></i>
        </span>
        <label class="font-bold">Range:</label>
      </p>

      <p class="ml-6 flex gap-2 items-center">
        <FormSlider
          v-model="state.radius"
          control-id="search-range"
          test-id="search-range"
          :min="10"
          :max="500"
          :step="10"
          :show-value="false"
        />

        <span class="text-nowrap text-right min-w-10">
          {{ state.radius }} km
        </span>
      </p>
    </template>
  </div>

  <div class="flex gap-2 ml-6">
    <FormButton
      :test-id="testId && `${testId}-select-btn`"
      @click="onSelectLocation"
    >
      <span class="text-xs">
        {{ value ? 'Change' : 'Select' }} location...
      </span>
    </FormButton>
    <FormButton
      :test-id="testId && `${testId}-clear-btn`"
      @click="onClearLocation"
    >
      <span class="text-xs">Clear location</span>
    </FormButton>
  </div>
</template>

<script lang="ts" setup>
import { GpsCoordinates, GpsCoordinatesWithRadius } from '@bottomtime/api';

import { reactive, ref, watch } from 'vue';

import LocationDialog from '../dialog/location-dialog.vue';
import FormButton from './form-button.vue';
import FormSlider from './form-slider.vue';

interface FormLocationSelectProps {
  showRadius?: boolean;
  testId?: string;
}

interface FormLocationSelectState {
  showLocationDialog: boolean;
  radius: number;
}

const props = withDefaults(defineProps<FormLocationSelectProps>(), {
  showRadius: false,
});
const value = defineModel<GpsCoordinates | GpsCoordinatesWithRadius>({
  required: false,
});
const state = reactive<FormLocationSelectState>({
  showLocationDialog: false,
  radius: value.value && 'radius' in value.value ? value.value.radius : 50,
});
const locationDialog = ref<InstanceType<typeof LocationDialog> | null>();

function onSelectLocation() {
  state.showLocationDialog = true;
}

function onCancelSelectLocation() {
  state.showLocationDialog = false;
  locationDialog.value?.reset();
}

function onConfirmSelectLocation(gps: GpsCoordinates) {
  state.showLocationDialog = false;
  locationDialog.value?.reset();

  value.value = props.showRadius
    ? {
        ...gps,
        radius: state.radius,
      }
    : gps;
}

function onClearLocation() {
  value.value = undefined;
}

watch(
  () => state.radius,
  () => {
    if (value.value) {
      value.value = {
        ...value.value,
        radius: state.radius,
      };
    }
  },
);
</script>
