<template>
  <div class="space-y-4">
    <form @submit.prevent="">
      <fieldset class="space-y-4" :disabled="state.isSearching">
        <FormSearchBox
          v-model.trim="state.search"
          control-id="operatorSearchQuery"
          test-id="operator-search-query"
          placeholder="Search for dive shop..."
          autofocus
          @search="onSearch"
        />

        <FormField label="Location">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GoogleMap :marker="state.location" @click="onLocationSelected" />

            <div class="space-y-3 text-center">
              <div class="flex flex-col">
                <label class="font-bold">GPS Coordinates</label>
                <div class="flex justify-center items-baseline gap-2">
                  <GpsCoordinatesText
                    class="font-mono text-sm"
                    :coordinates="state.location"
                  />
                  <button
                    v-if="state.location"
                    id="btn-clear-operator-location"
                    data-testid="btn-clear-operator-location"
                    class="bg-secondary-dark hover:bg-secondary-hover w-6 h-6 rounded-full shadow-md shadow-grey-900"
                    @click="onClearLocation"
                  >
                    <i class="fa-solid fa-xmark"></i>
                    <span class="sr-only">Clear location</span>
                  </button>
                </div>
              </div>

              <div v-if="state.location">
                <label class="font-bold">Distance</label>
                <div class="flex items-baseline gap-2">
                  <FormSlider
                    v-model="state.radius"
                    :min="10"
                    :max="500"
                    :step="10"
                    :show-value="false"
                  />
                  <span class="font-mono text-sm min-w-10 text-right"
                    >{{ state.radius }}km</span
                  >
                </div>
              </div>
            </div>
          </div>
        </FormField>

        <FormField>
          <FormCheckbox
            v-model="state.verified"
            control-id="operatorSearchVerified"
            test-id="operator-search-verified"
          >
            Show only verified dive shops
          </FormCheckbox>
        </FormField>

        <div class="text-center">
          <FormButton
            type="primary"
            control-id="searchOperators"
            test-id="search-operators"
            submit
            @click="onSearch"
          >
            Search
          </FormButton>
        </div>
      </fieldset>
    </form>

    <div v-if="state.isSearching" class="text-center">
      <LoadingSpinner message="Searching..." />
    </div>

    <div v-else>
      <p class="text-center my-1.5" data-testid="search-operator-counts">
        <span>Showing </span>
        <span class="font-bold text-sm font-mono">
          {{ state.operators.data.length }}
        </span>
        <span> of </span>
        <span class="font-bold text-sm font-mono">
          {{ state.operators.totalCount }}
        </span>
        <span> results.</span>
      </p>

      <TransitionList data-testid="search-operators-results-list" inverted>
        <SelectOperatorListItem
          v-for="operator in state.operators.data"
          :key="operator.slug"
          :operator="operator"
          :selected="operator.id === state.selectedOperator"
          @highlight="onOperatorHighlighted"
          @select="(operator) => $emit('operator-selected', operator)"
        />

        <li v-if="state.isLoadingMore" class="text-center text-lg italic">
          <LoadingSpinner message="Loading more results..." />
        </li>

        <li
          v-else-if="state.operators.data.length === 0"
          class="space-x-2 text-center italic text-lg"
          data-testid="search-operators-no-results"
        >
          <span>
            <i class="fa-solid fa-magnifying-glass"></i>
          </span>
          <span>Sorry, no dive shops match your search criteria.</span>
        </li>

        <li
          v-else-if="state.operators.data.length < state.operators.totalCount"
          class="text-center"
        >
          <FormButton
            type="link"
            size="lg"
            control-id="searchOperatorsLoadMore"
            test-id="search-operators-load-more"
            @click="onLoadMore"
          >
            Load more...
          </FormButton>
        </li>
      </TransitionList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ApiList,
  GpsCoordinates,
  OperatorDTO,
  SearchOperatorsParams,
  VerificationStatus,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useGeolocation } from '../../../geolocation';
import { useOops } from '../../../oops';
import FormButton from '../../common/form-button.vue';
import FormCheckbox from '../../common/form-checkbox.vue';
import FormField from '../../common/form-field.vue';
import FormSearchBox from '../../common/form-search-box.vue';
import FormSlider from '../../common/form-slider.vue';
import GoogleMap from '../../common/google-map.vue';
import GpsCoordinatesText from '../../common/gps-coordinates-text.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TransitionList from '../../common/transition-list.vue';
import SelectOperatorListItem from './select-operator-list-item.vue';

interface SearchOperatorsFormState {
  isLoadingMore: boolean;
  isSearching: boolean;
  location?: GpsCoordinates;
  operators: ApiList<OperatorDTO>;
  radius: number;
  search: string;
  selectedOperator?: string;
  verified: boolean;
}

const client = useClient();
const geolocation = useGeolocation();
const oops = useOops();

defineEmits<{
  (e: 'operator-selected', operator: OperatorDTO): void;
}>();

const state = reactive<SearchOperatorsFormState>({
  isLoadingMore: false,
  isSearching: false,
  operators: {
    data: [],
    totalCount: 0,
  },
  radius: 50,
  search: '',
  verified: false,
});

function getSearchParams(): SearchOperatorsParams {
  return {
    query: state.search || undefined,
    verification: state.verified ? VerificationStatus.Verified : undefined,
    ...(state.location
      ? { location: state.location, radius: state.radius }
      : {}),
  };
}

async function onSearch(): Promise<void> {
  state.isSearching = true;

  await oops(async () => {
    state.operators = await client.operators.searchOperators(getSearchParams());
  });

  state.isSearching = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const results = await client.operators.searchOperators({
      ...getSearchParams(),
      skip: state.operators.data.length,
    });

    state.operators.data.push(...results.data);
    state.operators.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

function onOperatorHighlighted(operator: OperatorDTO) {
  state.selectedOperator = operator.id;
}

function onLocationSelected(location: GpsCoordinates) {
  state.location = location;
}

function onClearLocation() {
  state.location = undefined;
}

onMounted(async () => {
  state.location = await geolocation.getCurrentLocation();
});
</script>
