<template>
  <FormBox class="sticky top-16 flex flex-col gap-3" shadow>
    <form @submit.prevent="onSearch">
      <FormField label="Search" :responsive="false">
        <FormSearchBox
          v-model="state.query"
          control-id="searchQuery"
          test-id="search-query"
          placeholder="Search log entries..."
          autofocus
          @search="onSearch"
        />
      </FormField>

      <FormField label="Start date" :responsive="false">
        <FormDatePicker
          v-model="state.startDate"
          control-id="searchStartDate"
          mode="date"
          placeholder="Show entries after..."
        />
      </FormField>

      <FormField label="End date" :responsive="false">
        <FormDatePicker
          v-model="state.endDate"
          control-id="searchEndDate"
          mode="date"
          placeholder="Show entries before..."
        />
      </FormField>

      <FormField label="Location" :responsive="false">
        <FormLocationPicker v-model="state.location" show-radius />
      </FormField>

      <FormField label="Minimum rating" :responsive="false">
        <div class="flex gap-1 items-baseline">
          <StarRating
            v-model="state.minRating"
            :show-value="!!state.minRating"
          />
          <a v-if="state.minRating" @click="onClearMinRating">Clear</a>
        </div>
      </FormField>

      <div class="text-center">
        <FormButton test-id="btn-search" submit @click="onSearch">
          Search
        </FormButton>
      </div>
    </form>
  </FormBox>
</template>

<script lang="ts" setup>
import {
  GpsCoordinatesWithRadius,
  ListLogEntriesParamsDTO,
} from '@bottomtime/api';

import { reactive, watch } from 'vue';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormLocationPicker from '../common/form-location-picker.vue';
import FormSearchBox from '../common/form-search-box.vue';
import StarRating from '../common/star-rating.vue';

interface LogbookSearchProps {
  params: ListLogEntriesParamsDTO;
}

interface LogbookSearchState {
  query: string;
  startDate?: Date;
  endDate?: Date;
  location?: GpsCoordinatesWithRadius;
  minRating?: number;
}

function getFormStateFromParams(
  params: ListLogEntriesParamsDTO,
): LogbookSearchState {
  return {
    query: params.query || '',
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    minRating: params.minRating,
    location: params.location
      ? {
          lat: params.location.lat,
          lon: params.location.lon,
          radius: params.radius ?? 50,
        }
      : undefined,
  };
}

const props = defineProps<LogbookSearchProps>();
const state = reactive<LogbookSearchState>(
  getFormStateFromParams(props.params),
);

const emit = defineEmits<{
  (e: 'search', options: ListLogEntriesParamsDTO): void;
}>();

function onSearch() {
  emit('search', {
    query: state.query,
    startDate: state.startDate?.valueOf(),
    endDate: state.endDate?.valueOf(),
    minRating: state.minRating,
    ...(state.location
      ? {
          location: {
            lat: state.location.lat,
            lon: state.location.lon,
          },
          radius: state.location.radius,
        }
      : {}),
  });
}

function onClearMinRating() {
  state.minRating = undefined;
}

watch(
  () => props.params,
  (params) => {
    Object.assign(state, getFormStateFromParams(params));
  },
);
</script>
