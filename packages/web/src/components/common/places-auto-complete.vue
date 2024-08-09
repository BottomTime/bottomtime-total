<template>
  <FormTextBox
    ref="input"
    v-model="value"
    :autofocus="autofocus"
    :control-id="controlId"
    :test-id="testId"
    :placeholder="placeholder"
    :maxlength="maxlength"
    :invalid="invalid"
  />
</template>

<script lang="ts" setup>
import { GPSCoordinates } from '@bottomtime/api';

import { onMounted, ref } from 'vue';

import { Config } from '../../config';
import { useGoogle } from '../../google-loader';
import FormTextBox from './form-text-box.vue';

interface PlacesAutoCompleteProps {
  autofocus?: boolean;
  center?: GPSCoordinates;
  controlId: string;
  invalid?: boolean;
  placeholder?: string;
  maxlength?: number;
  testId?: string;
}

const input = ref<InstanceType<typeof FormTextBox> | null>(null);
const value = defineModel<string>({ default: '' });
const props = defineProps<PlacesAutoCompleteProps>();
const emit = defineEmits<{
  (e: 'place-changed', place: NonNullable<GPSCoordinates>): void;
}>();
const autocomplete = ref<globalThis.google.maps.places.Autocomplete | null>(
  null,
);

function onPlaceChanged() {
  const place = autocomplete.value?.getPlace();
  if (place) {
    value.value = place.formatted_address ?? '';
    if (place.geometry?.location) {
      emit('place-changed', {
        lat: place.geometry.location.lat(),
        lon: place.geometry.location.lng(),
      });
    }
  }
}

onMounted(async () => {
  if (!Config.enablePlacesApi) return;

  const loader = useGoogle();
  const Places = await loader.importLibrary('places');
  const input = document.getElementById(props.controlId) as HTMLInputElement;
  const opts: globalThis.google.maps.places.AutocompleteOptions = {
    bounds: props.center
      ? {
          north: props.center.lat + 0.1,
          south: props.center.lat - 0.1,
          east: props.center.lon + 0.1,
          west: props.center.lon - 0.1,
        }
      : undefined,
    fields: ['place_id', 'name', 'formatted_address', 'geometry'],
    strictBounds: false,
  };
  autocomplete.value = new Places.Autocomplete(input, opts);
  autocomplete.value.addListener('place_changed', onPlaceChanged);
});

function focus() {
  input.value?.focus();
}

defineExpose({ focus });
</script>
