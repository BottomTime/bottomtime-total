<template>
  <div v-if="state.isLoading" class="py-4 text-center">
    <LoadingSpinner message="Fetching dive sites..." />
  </div>

  <div v-else>
    <FormBox data-testid="offered-by-operator-list-counts">
      <span>Showing </span>
      <span class="font-bold">{{ state.sites.data.length }}</span>
      <span> out of </span>
      <span class="font-bold">{{ state.sites.totalCount }}</span>
      <span> dive sites offered by </span>
      <span class="font-bold">{{ operator.name }}</span>
      <span>.</span>
    </FormBox>

    <DiveSitesList
      :sites="state.sites"
      :show-map="false"
      :is-loading-more="state.isLoadingMore"
      @site-selected="(site) => $emit('site-selected', site)"
      @load-more="onLoadMore"
    />
  </div>
</template>

<script lang="ts" setup>
import { ApiList, DiveSiteDTO, OperatorDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormBox from '../../common/form-box.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import DiveSitesList from '../dive-sites-list.vue';

interface OfferedByOperatorListProps {
  currentSite?: DiveSiteDTO;
  operator: OperatorDTO;
}

interface OfferedByOperatorListState {
  isLoading: boolean;
  isLoadingMore: boolean;
  sites: ApiList<DiveSiteDTO>;
}

const client = useClient();
const oops = useOops();

const props = defineProps<OfferedByOperatorListProps>();
const state = reactive<OfferedByOperatorListState>({
  isLoading: true,
  isLoadingMore: false,
  sites: {
    data: [],
    totalCount: 0,
  },
});
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const results = await client.operators.listDiveSites(props.operator.slug, {
      limit: 30,
      skip: state.sites.data.length,
    });
    state.sites.data.push(...results.data);
    state.sites.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

onMounted(async () => {
  await oops(async () => {
    state.sites = await client.operators.listDiveSites(props.operator.slug, {
      limit: 30,
    });
  });

  state.isLoading = false;
});
</script>
