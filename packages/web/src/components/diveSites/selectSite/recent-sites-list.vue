<template>
  <div class="space-y-4">
    <p class="text-sm text-center">
      Here are your most recently used dive sites. These are the entries you've
      used on your most recently created log entries.
    </p>

    <div v-if="currentSite">
      <TextHeading level="h3">Current Site</TextHeading>
      <SelectDiveSiteListItem
        v-if="currentSite"
        :site="currentSite"
        :selected="state.selectedSite === currentSite.id"
        @highlight="onSiteHighlighted"
        @select="(site) => $emit('site-selected', site)"
      />
    </div>

    <div>
      <TextHeading v-if="currentSite" level="h3">Recent Sites</TextHeading>

      <div v-if="state.isLoading" class="py-3 text-center">
        <LoadingSpinner message="Fetching most recently logged sites..." />
      </div>

      <ul v-else-if="state.recentSites && state.recentSites.length">
        <SelectDiveSiteListItem
          v-for="site in state.recentSites"
          :key="site.id"
          :site="site"
          :selected="state.selectedSite === site.id"
          @highlight="onSiteHighlighted"
          @select="(site) => $emit('site-selected', site)"
        />
      </ul>

      <p
        v-else
        class="text-center flex gap-3 items-baseline justify-center p-2 bg-blue-500/40 dark:bg-blue-600/40 border-l-2 border-grey-800 rounded-r-md"
      >
        <span>
          <i class="fa-solid fa-circle-info"></i>
        </span>
        <span>
          It seems you don't have any recent sites to display. You can search
          for existing sites
          <FormButton type="link" size="sm" @click="$emit('search')">
            here
          </FormButton>
          .
        </span>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TextHeading from '../../common/text-heading.vue';
import SelectDiveSiteListItem from './select-dive-site-list-item.vue';

interface RecentSitesListProps {
  currentSite?: DiveSiteDTO;
}

interface RecetSitesState {
  isLoading: boolean;
  selectedSite?: string;
  recentSites: DiveSiteDTO[];
}

const client = useClient();
const oops = useOops();
const route = useRoute();

const props = defineProps<RecentSitesListProps>();
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'search'): void;
}>();
const state = reactive<RecetSitesState>({
  isLoading: true,
  selectedSite: props.currentSite?.id,
  recentSites: [],
});

onMounted(async () => {
  state.isLoading = true;

  await oops(async () => {
    if (typeof route.params.username !== 'string') return;
    const recentSites = await client.logEntries.getMostRecentDiveSites(
      route.params.username,
    );
    state.recentSites = recentSites.map((site) => site.toJSON());
  });

  state.isLoading = false;
});

function onSiteHighlighted(site: DiveSiteDTO) {
  state.selectedSite = site.id;
}
</script>
