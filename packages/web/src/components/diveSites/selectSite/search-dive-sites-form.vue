<template>
  <div class="space-y-4">
    <form class="space-y-4" @submit.prevent="onSearch">
      <FormSearchBox
        id="site-search"
        v-model="state.search"
        placeholder="Search for a dive site..."
        autofocus
        @search="onSearch"
      />

      <div class="px-16 space-y-1.5">
        <GoogleMap
          :marker="state.location"
          :sites="state.sites?.sites"
          @click="onLocationChange"
          @site-selected="onSiteHighlighted"
        />
        <p class="text-sm text-center text-grey-500" italic>
          Click a place on the map to center your search around that point.
        </p>

        <FormField
          label="Search radius (km)"
          control-id="site-search-radius"
          :responsive="false"
          required
        >
          <FormSlider
            v-model="state.radius"
            control-id="site-search-radius"
            test-id="site-search-radius"
            :min="10"
            :max="500"
            :step="10"
          />
        </FormField>
      </div>

      <div class="text-center">
        <FormButton type="primary" submit>Search</FormButton>
      </div>
    </form>

    <div v-if="state.isSearching" class="text-center">
      <LoadingSpinner message="Searching..." />
    </div>

    <div v-else-if="state.sites">
      <p class="text-center my-1.5">
        <span>Showing </span>
        <span class="font-bold">{{ state.sites.sites.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.sites.totalCount }}</span>
        <span> dive sites.</span>
      </p>
      <ul class="*:odd:bg-blue-300/40 *:odd:dark:bg-blue-900/40">
        <SelectDiveSiteListItem
          v-for="site in state.sites.sites"
          :key="site.id"
          :site="site"
          :selected="site.id === state.selectedSite"
          @highlight="onSiteHighlighted"
          @select="(site) => $emit('site-selected', site)"
        />
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  DiveSiteDTO,
  GPSCoordinates,
  SearchDiveSitesResponseDTO,
} from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import FormSearchBox from '../../common/form-search-box.vue';
import FormSlider from '../../common/form-slider.vue';
import GoogleMap from '../../common/google-map.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import SelectDiveSiteListItem from './select-dive-site-list-item.vue';

interface SelectDiveSiteListState {
  isSearching: boolean;
  location?: GPSCoordinates;
  radius: number;
  search: string;
  selectedSite?: string;
  sites?: SearchDiveSitesResponseDTO;
}

const client = useClient();
const oops = useOops();

const emit = defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

const state = reactive<SelectDiveSiteListState>({
  isSearching: false,
  radius: 100,
  search: '',
});

function onLocationChange(location?: GPSCoordinates): void {
  state.location = location;
}

async function onSearch(): Promise<void> {
  state.isSearching = true;

  await oops(async () => {
    const results = await client.diveSites.searchDiveSites({
      query: state.search || undefined,
      location: state.location,
      radius: state.location ? state.radius : undefined,
    });
    state.sites = {
      sites: results.sites.map((site) => site.toJSON()),
      totalCount: results.totalCount,
    };
  });

  state.isSearching = false;
}

function onSiteHighlighted(site: DiveSiteDTO): void {
  state.selectedSite = site.id;
}
</script>
