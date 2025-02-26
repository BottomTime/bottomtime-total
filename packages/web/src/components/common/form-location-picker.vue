<template>
  <div class="flex flex-col gap-2 items-center">
    <GoogleMap
      :center="location"
      :marker="location"
      :test-id="`${testId}-map`"
      @click="onMapClick"
    />
    <div>
      <form
        v-if="state.editMode"
        class="text-sm"
        @submit.prevent=""
        @keyup.escape.prevent="onCancelEdit"
      >
        <div class="flex justify-center items-baseline flex-nowrap">
          <FormTextBox
            ref="latitudeText"
            v-model.number="state.lat"
            :test-id="`${testId}-lat`"
            :invalid="v$.lat.$error"
            :maxlength="10"
            placeholder="Latitude"
          />
          <span class="text-lg mx-0.5 font-bold">,</span>
          <FormTextBox
            v-model.number="state.lon"
            :test-id="`${testId}-lon`"
            :invalid="v$.lon.$error"
            :maxlength="10"
            placeholder="Longitude"
          />
        </div>
        <ul
          v-if="v$.$error"
          class="text-xs text-danger p-0.5 ml-4 list-disc list-outside"
        >
          <li v-if="v$.lat.$error">{{ v$.lat.$errors[0]?.$message }}</li>
          <li v-if="v$.lon.$error">{{ v$.lon.$errors[0]?.$message }}</li>
        </ul>
        <div class="flex gap-1 justify-center flex-nowrap">
          <button
            type="submit"
            :data-testid="`${testId}-save`"
            @click="onSaveEdit"
          >
            <a>Set</a>
          </button>
          <button
            type="reset"
            :data-testid="`${testId}-cancel`"
            @click="onCancelEdit"
          >
            <a>Cancel</a>
          </button>
        </div>
      </form>

      <p v-else class="flex gap-2 items-baseline flex-wrap text-sm">
        <GpsCoordinatesText
          :coordinates="location"
          :data-testid="`${testId}-gps`"
        />
        <button :data-testid="`${testId}-set`" @click="onEdit">
          <a>Set</a>
        </button>
        <button
          v-if="location"
          :data-testid="`${testId}-clear`"
          @click="onClearLocation"
        >
          <a>Clear</a>
        </button>
      </p>

      <div v-if="showRadius" class="flex items-baseline gap-0.5">
        <FormSlider
          v-model="state.radius"
          :test-id="`${testId}-radius`"
          :min="10"
          :max="500"
          :step="10"
          :show-value="false"
        />
        <span>{{ state.radius.toFixed(0) }}km</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { GpsCoordinates, GpsCoordinatesWithRadius } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { nextTick, reactive, ref, watch } from 'vue';

import { latitude, longitude } from '../../validators';
import FormSlider from './form-slider.vue';
import FormTextBox from './form-text-box.vue';
import GoogleMap from './google-map.vue';
import GpsCoordinatesText from './gps-coordinates-text.vue';

interface FormLocationPickerProps {
  showRadius?: boolean;
  testId?: string;
}

interface FormLocationPickerState {
  editMode: boolean;
  lat: number | string;
  lon: number | string;
  radius: number;
}

const latitudeText = ref<InstanceType<typeof FormTextBox> | null>(null);
const location = defineModel<GpsCoordinatesWithRadius>({
  required: false,
});
const state = reactive<FormLocationPickerState>({
  editMode: false,
  lat: location.value?.lat ?? '',
  lon: location.value?.lon ?? '',
  radius: location.value?.radius ?? 50,
});
const props = withDefaults(defineProps<FormLocationPickerProps>(), {
  showRadius: false,
  testId: 'location-picker',
});

const v$ = useVuelidate(
  {
    lat: {
      required: helpers.withMessage('Latitude is required', required),
      latitude: helpers.withMessage(
        'Latitude must be a valid number between -90 and 90',
        latitude,
      ),
    },
    lon: {
      required: helpers.withMessage('Longitude is required', required),
      latitude: helpers.withMessage(
        'Longitude must be a valid number between -180 and 180',
        longitude,
      ),
    },
  },
  state,
);

function onMapClick(newLocation: GpsCoordinates) {
  state.lat = newLocation.lat;
  state.lon = newLocation.lon;
  location.value = {
    ...newLocation,
    radius:
      location.value?.radius ?? (props.showRadius ? state.radius : undefined),
  };
}

function onClearLocation() {
  location.value = undefined;
}

async function onEdit(): Promise<void> {
  v$.value.$reset();
  state.editMode = true;

  await nextTick();

  latitudeText.value?.focus();
}

function onCancelEdit() {
  state.editMode = false;
  state.lat = location.value?.lat ?? '';
  state.lon = location.value?.lon ?? '';
}

async function onSaveEdit(): Promise<void> {
  const isValid = await v$.value.$validate();

  if (isValid) {
    location.value = {
      lat: state.lat as number,
      lon: state.lon as number,
      radius: props.showRadius ? state.radius : undefined,
    };
    state.editMode = false;
  }
}

watch(
  () => state.radius,
  (newRadius) => {
    if (location.value) {
      location.value.radius = newRadius;
    }
  },
);

watch(location, (newLocation) => {
  if (newLocation) {
    state.lat = newLocation.lat;
    state.lon = newLocation.lon;
    state.radius = newLocation.radius ?? 50;
  } else {
    state.lat = '';
    state.lon = '';
    state.radius = 50;
  }
});
</script>
