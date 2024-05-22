<template>
  <div>
    <form class="space-y-4" @submit.prevent="onSearch">
      <FormSearchBox
        id="site-search"
        v-model="state.search"
        placeholder="Search for a dive site..."
        autofocus
        @search="onSearch"
      />

      <div class="px-16 space-y-1.5">
        <GoogleMap :marker="state.location" @click="onLocationChange" />
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

    <div v-if="state.sites">
      <p>Found {{ state.sites.totalCount }} sites</p>
      <ul>
        <li v-for="site in state.sites.sites" :key="site.id">
          {{ site.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { GPSCoordinates, SearchDiveSitesResponseDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSearchBox from '../common/form-search-box.vue';
import FormSlider from '../common/form-slider.vue';
import GoogleMap from '../common/google-map.vue';

interface SelectDiveSiteListState {
  location?: GPSCoordinates;
  radius: number;
  search: string;
  sites?: SearchDiveSitesResponseDTO;
}

const client = useClient();
const oops = useOops();

const state = reactive<SelectDiveSiteListState>({
  radius: 100,
  search: '',
});

function onLocationChange(location?: GPSCoordinates): void {
  state.location = location;
}

async function onSearch(): Promise<void> {
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
}
</script>
