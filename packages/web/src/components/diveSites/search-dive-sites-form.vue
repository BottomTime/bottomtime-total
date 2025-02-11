<template>
  <form class="flex flex-col sticky top-20" @submit.prevent="">
    <FormField :responsive="false">
      <FormSearchBox
        v-model.trim="state.query"
        control-id="search"
        :maxlength="200"
        placeholder="Search dive sites"
        test-id="search-dive-sites"
        autofocus
        @search="onRefresh"
      />
    </FormField>

    <div :class="state.showAdvancedSearch ? '' : 'hidden lg:block'">
      <FormField label="Location" :responsive="false">
        <FormLocationPicker v-model="state.gps" show-radius />
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

      <FormField label="Water Type" :responsive="false">
        <div class="flex flex-col gap-1 pl-2">
          <FormRadio
            v-model="state.waterType"
            control-id="water-type-all"
            test-id="water-type-all"
            group="water-type"
            value=""
          >
            Any
          </FormRadio>
          <FormRadio
            v-model="state.waterType"
            control-id="water-type-salt"
            test-id="water-type-salt"
            group="water-type"
            :value="WaterType.Salt"
          >
            Salt water
          </FormRadio>
          <FormRadio
            v-model="state.waterType"
            control-id="water-type-fresh"
            test-id="water-type-fresh"
            group="water-type"
            :value="WaterType.Fresh"
          >
            Fresh water
          </FormRadio>
          <FormRadio
            v-model="state.waterType"
            control-id="water-type-mixed"
            test-id="water-type-mixed"
            group="water-type"
            :value="WaterType.Mixed"
          >
            Mixed
          </FormRadio>
        </div>
      </FormField>

      <div class="text-center">
        <FormButton test-id="refresh-dive-sites" submit @click="onRefresh">
          Refresh
        </FormButton>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import {
  GpsCoordinatesWithRadius,
  SearchDiveSitesParamsDTO,
  WaterType,
} from '@bottomtime/api';

import { reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormLocationPicker from '../common/form-location-picker.vue';
import FormRadio from '../common/form-radio.vue';
import FormSearchBox from '../common/form-search-box.vue';
import FormSlider from '../common/form-slider.vue';

type SearchDiveSitesFormProps = {
  params: SearchDiveSitesParamsDTO;
};

type SearchDiveSitesFormState = {
  maxDifficulty: number;
  minRating: number;
  query: string;
  gps?: GpsCoordinatesWithRadius;
  shoreAccess: string;
  freeToDive: string;
  waterType: WaterType | '';
  showAdvancedSearch: boolean;
};

const props = defineProps<SearchDiveSitesFormProps>();
const emit = defineEmits<{
  (e: 'search', query: SearchDiveSitesParamsDTO): void;
}>();
const state = reactive<SearchDiveSitesFormState>({
  maxDifficulty: props.params.difficulty?.max || 5,
  minRating: props.params.rating?.min || 1,
  query: props.params.query || '',
  gps: props.params.location
    ? {
        ...props.params.location,
        radius: props.params.radius,
      }
    : undefined,
  shoreAccess:
    typeof props.params.shoreAccess === 'boolean'
      ? props.params.shoreAccess.toString()
      : '',
  freeToDive:
    typeof props.params.freeToDive === 'boolean'
      ? props.params.freeToDive.toString()
      : '',
  waterType: props.params.waterType || '',

  showAdvancedSearch: false,
});

function onRefresh() {
  const query: SearchDiveSitesParamsDTO = {
    query: state.query || undefined,
    difficulty:
      state.maxDifficulty < 5
        ? {
            min: 1,
            max: state.maxDifficulty,
          }
        : undefined,
    rating:
      state.minRating > 1
        ? {
            min: state.minRating,
            max: 5,
          }
        : undefined,
    shoreAccess:
      state.shoreAccess === '' ? undefined : state.shoreAccess === 'true',
    freeToDive:
      state.freeToDive === '' ? undefined : state.freeToDive === 'true',
    waterType:
      state.waterType === '' ? undefined : (state.waterType as WaterType),
    location: state.gps
      ? { lat: state.gps.lat, lon: state.gps.lon }
      : undefined,
    radius: state.gps?.radius,
  };

  emit('search', query);
}
</script>
