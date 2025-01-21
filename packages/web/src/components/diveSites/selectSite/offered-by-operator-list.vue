<template>
  <div v-if="state.isLoading" class="py-4 text-center">
    <LoadingSpinner message="Fetching dive sites..." />
  </div>

  <div v-else>
    <FormBox>
      <span>Showing </span>
      <span class="font-bold">{{ state.sites.data.length }}</span>
      <span> out of </span>
      <span class="font-bold">{{ state.sites.totalCount }}</span>
      <span> dive sites offered by </span>
      <span class="font-bold">{{ operator.name }}</span>
      <span>.</span>
    </FormBox>

    <TransitionList> </TransitionList>
  </div>
</template>

<script lang="ts" setup>
import { ApiList, DiveSiteDTO, OperatorDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormBox from '../../common/form-box.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TransitionList from '../../common/transition-list.vue';

interface OfferedByOperatorListProps {
  currentSite?: DiveSiteDTO;
  operator: OperatorDTO;
}

interface OfferedByOperatorListState {
  isLoading: boolean;
  sites: ApiList<DiveSiteDTO>;
}

const client = useClient();
const oops = useOops();

const props = defineProps<OfferedByOperatorListProps>();
const state = reactive<OfferedByOperatorListState>({
  isLoading: true,
  sites: {
    data: [],
    totalCount: 0,
  },
});

onMounted(async () => {
  await oops(async () => {
    state.sites = await client.operators.listDiveSites(props.operator.slug);
  });

  state.isLoading = false;
});
</script>
