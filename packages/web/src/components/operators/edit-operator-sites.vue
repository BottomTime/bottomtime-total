<template>
  <DrawerPanel
    :visible="state.showAddSite"
    title="Add Dive Sites"
    @close="onCancelAddSites"
  >
    <SelectSite
      :is-adding-sites="state.isAddingSites"
      :show-recent="false"
      multi-select
      @multi-select="onSitesAdded"
    />
  </DrawerPanel>

  <LoadingSpinner v-if="state.isLoading" message="Fetching dive sites..." />

  <div v-else>
    <FormBox class="flex justify-between items-baseline">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ state.sites.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.sites.totalCount }}</span>
        <span> dive sites.</span>
      </p>
      <div>
        <FormButton class="space-x-1" type="primary" @click="onAddSite">
          <span>
            <i class="fa-solid fa-plus"></i>
          </span>
          <span>Add Site</span>
        </FormButton>
      </div>
    </FormBox>

    <DiveSitesList :data="state.sites" :show-map="false" />
  </div>
</template>

<script lang="ts" setup>
import { ApiList, DiveSiteDTO, OperatorDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import DrawerPanel from '../common/drawer-panel.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import DiveSitesList from '../diveSites/dive-sites-list.vue';
import SelectSite from '../diveSites/selectSite/select-site.vue';

interface EditOperatorSitesProps {
  operator: OperatorDTO;
}

interface EditOperatorSitesState {
  isAddingSites: boolean;
  isLoading: boolean;
  showAddSite: boolean;
  sites: ApiList<DiveSiteDTO>;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<EditOperatorSitesProps>();
const state = reactive<EditOperatorSitesState>({
  isAddingSites: false,
  isLoading: true,
  showAddSite: false,
  sites: {
    data: [],
    totalCount: 0,
  },
});

function onAddSite() {
  state.showAddSite = true;
}

function onCancelAddSites() {
  state.showAddSite = false;
}

async function onSitesAdded(sites: DiveSiteDTO[]): Promise<void> {
  state.isAddingSites = true;

  await oops(async () => {
    const added = await client.operators.addDiveSites(
      props.operator.slug,
      sites.map((site) => site.id),
    );

    toasts.toast({
      id: 'operator-sites-added',
      message: `Added ${added} dive sites to ${props.operator.name}.`,
      type: ToastType.Success,
    });

    state.showAddSite = false;
  });

  state.isAddingSites = false;
}

onMounted(async () => {
  await oops(async () => {
    state.sites = await client.operators.listDiveSites(props.operator.slug);
  });

  state.isLoading = false;
});
</script>
