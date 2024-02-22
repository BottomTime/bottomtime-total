<template>
  <LocationDialog
    ref="locationDialog"
    :visible="state.showLocationDialog"
    :location="state.gps"
    @cancel="onCancelSelectLocation"
    @confirm="onConfirmSelectLocation"
  />

  <form class="flex flex-col sticky top-20" @submit.prevent="">
    <FormField :responsive="false">
      <FormTextBox
        v-model="state.query"
        control-id="search"
        :maxlength="200"
        placeholder="Search dive sites"
        test-id="search-dive-sites"
        show-right
        autofocus
      >
        <template #right>
          <i class="fas fa-search"></i>
        </template>
      </FormTextBox>
    </FormField>

    <FormField label="Location" :responsive="false">
      <div v-if="state.gps" class="text-sm mb-2">
        <p class="flex gap-2">
          <span class="text-danger">
            <i class="fas fa-map-marker-alt"></i>
          </span>
          <label class="font-bold">Coordinates:</label>
        </p>
        <p class="ml-6">
          <span data-testid="search-coordinates">
            {{ state.gps.lat }}, {{ state.gps.lon }}
          </span>
        </p>
        <p class="flex gap-2">
          <span>
            <i class="fas fa-ruler-horizontal"></i>
          </span>
          <label class="font-bold">Range:</label>
        </p>
        <p class="ml-6 my-2">
          <FormSlider
            v-model="state.range"
            control-id="search-range"
            test-id="search-range"
            :min="10"
            :max="500"
            :step="10"
            :show-value="false"
          />
        </p>
        <p class="ml-6">
          <span>{{ state.range }} km</span>
        </p>
      </div>

      <div class="flex gap-2">
        <FormButton
          test-id="select-location"
          size="sm"
          @click="onSelectLocation"
        >
          {{ state.gps ? 'Change' : 'Select' }} Location
        </FormButton>
        <FormButton
          v-if="state.gps"
          size="sm"
          test-id="clear-location"
          @click="onClearLocation"
        >
          Clear
        </FormButton>
      </div>
    </FormField>

    <FormField label="Minimum Rating" control-id="rating" :responsive="false">
      <div class="flex gap-2">
        <span>
          <i class="fas fa-star text-warn-hover"></i>
        </span>
        <FormSlider
          v-model="state.minRating"
          :min="1"
          :max="5"
          :step="0.5"
          control-id="rating"
          test-id="rating"
        />
      </div>
    </FormField>

    <FormField
      label="Maximum Difficulty"
      control-id="difficulty"
      :responsive="false"
    >
      <div class="flex gap-2">
        <span>
          <i class="fas fa-tachometer-alt text-warn-hover"></i>
        </span>
        <FormSlider
          v-model="state.maxDifficulty"
          :min="1"
          :max="5"
          :step="0.5"
          control-id="difficulty"
          test-id="difficulty"
        />
      </div>
    </FormField>

    <FormField label="Shore Access" :responsive="false">
      <div class="flex flex-col gap-1 pl-2">
        <FormRadio
          v-model="state.shoreAccess"
          control-id="shore-access-all"
          test-id="shore-access-all"
          group="shore-access"
          value=""
        >
          Any
        </FormRadio>
        <FormRadio
          v-model="state.shoreAccess"
          control-id="shore-access-true"
          test-id="shore-access-true"
          group="shore-access"
          value="true"
        >
          Accessible from shore
        </FormRadio>
        <FormRadio
          v-model="state.shoreAccess"
          control-id="shore-access-false"
          test-id="shore-access-false"
          group="shore-access"
          value="false"
        >
          Accessible by boat
        </FormRadio>
      </div>
    </FormField>

    <FormField label="Free to dive" :responsive="false">
      <div class="flex flex-col gap-1 pl-2">
        <FormRadio
          v-model="state.freeToDive"
          control-id="free-to-dive-all"
          test-id="free-to-dive-all"
          group="free-to-dive"
          value=""
        >
          Any
        </FormRadio>
        <FormRadio
          v-model="state.freeToDive"
          control-id="free-to-dive-true"
          test-id="free-to-dive-true"
          group="free-to-dive"
          value="true"
        >
          Free to dive
        </FormRadio>
        <FormRadio
          v-model="state.freeToDive"
          control-id="free-to-dive-false"
          test-id="free-to-dive-false"
          group="free-to-dive"
          value="false"
        >
          Fee required
        </FormRadio>
      </div>
    </FormField>

    <div class="text-center">
      <FormButton
        type="primary"
        test-id="refresh-dive-sites"
        submit
        @click="onRefresh"
      >
        Refresh
      </FormButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { GpsCoordinates, SearchDiveSitesParamsDTO } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormRadio from '../common/form-radio.vue';
import FormSlider from '../common/form-slider.vue';
import FormTextBox from '../common/form-text-box.vue';
import LocationDialog from '../dialog/location-dialog.vue';

type SearchDiveSitesFormProps = {
  params: SearchDiveSitesParamsDTO;
};

type SearchDiveSitesFormState = {
  maxDifficulty: number;
  minRating: number;
  query: string;
  gps?: GpsCoordinates;
  range: number;
  shoreAccess: string;
  freeToDive: string;
  showLocationDialog: boolean;
};

const props = defineProps<SearchDiveSitesFormProps>();
const emit = defineEmits<{
  (e: 'search', query: SearchDiveSitesParamsDTO): void;
}>();
const state = reactive<SearchDiveSitesFormState>({
  maxDifficulty: props.params.difficulty?.max || 5,
  minRating: props.params.rating?.min || 1,
  query: props.params.query || '',
  gps: props.params.location,
  range: 50,
  shoreAccess:
    typeof props.params.shoreAccess === 'boolean'
      ? props.params.shoreAccess.toString()
      : '',
  freeToDive:
    typeof props.params.freeToDive === 'boolean'
      ? props.params.freeToDive.toString()
      : '',

  showLocationDialog: false,
});
const locationDialog = ref<InstanceType<typeof LocationDialog> | null>(null);

function onRefresh() {
  const query: SearchDiveSitesParamsDTO = {
    query: state.query || undefined,
    difficulty: {
      min: 1,
      max: state.maxDifficulty,
    },
    rating: {
      min: state.minRating,
      max: 5,
    },
    shoreAccess:
      state.shoreAccess === '' ? undefined : state.shoreAccess === 'true',
    freeToDive:
      state.freeToDive === '' ? undefined : state.freeToDive === 'true',
    location: state.gps,
    radius: state.range,
  };

  emit('search', query);
}

function onSelectLocation() {
  state.showLocationDialog = true;
}

function onConfirmSelectLocation(location: GpsCoordinates) {
  state.showLocationDialog = false;
  state.gps = location;
}

function onCancelSelectLocation() {
  state.showLocationDialog = false;
  locationDialog.value?.reset();
}

function onClearLocation() {
  state.gps = undefined;
  locationDialog.value?.reset();
}
</script>
