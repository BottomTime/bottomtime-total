<template>
  <div class="space-y-3">
    <p class="text-sm">Here are your most recently used sites.</p>

    <TextHeading>Current Site</TextHeading>
    <SelectDiveSiteListItem
      v-if="currentSite"
      :site="currentSite"
      :selected="state.selectedSite === currentSite.id"
    />

    <TextHeading>Recent Sites</TextHeading>
    <ul></ul>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import TextHeading from '../../common/text-heading.vue';
import SelectDiveSiteListItem from './select-dive-site-list-item.vue';

interface RecentSitesList {
  currentSite?: DiveSiteDTO;
}

interface RecetSitesState {
  selectedSite?: string;
}

const props = defineProps<RecentSitesList>();
const state = reactive<RecetSitesState>({
  selectedSite: props.currentSite?.id,
});
</script>
