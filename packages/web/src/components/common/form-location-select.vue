<template>
  <LocationDialog
    ref="locationDialog"
    :visible="state.showLocationDialog"
    :location="value ?? undefined"
    @cancel="onCancelSelectLocation"
    @confirm="onConfirmSelectLocation"
  />

  <div v-if="value" class="text-sm mb-2">
    <p>yo</p>
  </div>

  <div class="flex gap-2">
    <FormButton test-id="select-location" size="sm" @click="onSelectLocation">
      {{ value ? 'Change' : 'Select' }} Location...
    </FormButton>
  </div>
</template>

<script lang="ts" setup>
import { GpsCoordinates } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import LocationDialog from '../dialog/location-dialog.vue';
import FormButton from './form-button.vue';

interface FormLocationSelectState {
  showLocationDialog: boolean;
}

const value = defineModel<GpsCoordinates | null>();
const state = reactive<FormLocationSelectState>({
  showLocationDialog: false,
});
const locationDialog = ref<InstanceType<typeof LocationDialog> | null>();

function onSelectLocation() {
  state.showLocationDialog = true;
}

function onCancelSelectLocation() {
  state.showLocationDialog = false;
  locationDialog.value?.reset();
}

function onConfirmSelectLocation() {
  state.showLocationDialog = false;
  locationDialog.value?.reset();
}
</script>
