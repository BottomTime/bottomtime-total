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

  <ConfirmDialog
    :visible="state.showConfirmRemoveSites"
    title="Remove Selected Sites?"
    confirm-text="Remove"
    :is-loading="state.isRemovingSites"
    dangerous
    @confirm="onConfirmRemoveSelected"
    @cancel="onCancelRemoveSelected"
  >
    <p>
      <span>Are you sure you want to remove </span>
      <span class="font-bold">{{ selectedSitesCount }}</span>
      <span> dive site(s) from your shop's list?</span>
    </p>

    <p>
      This will not delete the dive site itself, but rather the site will no
      longer appear when users check to see which sites your shop offers.
    </p>
  </ConfirmDialog>

  <LoadingSpinner v-if="state.isLoading" message="Fetching dive sites..." />

  <div v-else class="space-y-4">
    <p class="text-lg text-center text-pretty">
      Manage the dive sites that your dive shop services. Here is a great place
      to list local dive sites that your shop runs charters to or that your
      customers frequently visit. When those sites appear in search results,
      your shop will be recommended to users who are looking to dive there.
    </p>

    <FormBox class="flex justify-between items-baseline">
      <p data-testid="operator-site-counts">
        <span>Showing </span>
        <span class="font-bold">{{ state.sites.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.sites.totalCount }}</span>
        <span> dive sites.</span>
      </p>

      <div class="flex gap-2">
        <div>
          <FormButton size="sm" rounded="left" @click="refreshSitesList">
            <i class="fa-solid fa-rotate-right"></i>
            <span class="sr-only">Refresh sites list</span>
          </FormButton>
          <FormButton
            control-id="btn-remove-sites"
            test-id="btn-remove-sites"
            type="danger"
            size="sm"
            rounded="right"
            :disabled="!selectedSitesCount"
            @click="onRemoveSelected"
          >
            <i class="fa-solid fa-trash"></i>
            <span class="sr-only">Remove selected sites</span>
          </FormButton>
        </div>

        <FormButton
          control-id="btn-add-sites"
          test-id="btn-add-sites"
          class="space-x-1"
          type="primary"
          size="sm"
          @click="onAddSite"
        >
          <span>
            <i class="fa-solid fa-plus"></i>
          </span>
          <span>Add Sites</span>
        </FormButton>
      </div>
    </FormBox>

    <DiveSitesList
      :sites="state.sites"
      :show-map="false"
      :is-loading-more="state.isLoadingMore"
      multi-select
      @load-more="onLoadMore"
    />
  </div>
</template>

<script lang="ts" setup>
import { ApiList, DiveSiteDTO, OperatorDTO } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { Selectable, ToastType } from '../../../common';
import { useOops } from '../../../oops';
import { useToasts } from '../../../store';
import DrawerPanel from '../../common/drawer-panel.vue';
import FormBox from '../../common/form-box.vue';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import DiveSitesList from '../../diveSites/dive-sites-list.vue';
import SelectSite from '../../diveSites/selectSite/select-site.vue';

interface EditOperatorSitesProps {
  operator: OperatorDTO;
}

interface EditOperatorSitesState {
  isAddingSites: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRemovingSites: boolean;
  showAddSite: boolean;
  showConfirmRemoveSites: boolean;
  sites: ApiList<Selectable<DiveSiteDTO>>;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<EditOperatorSitesProps>();
const state = reactive<EditOperatorSitesState>({
  isAddingSites: false,
  isLoading: true,
  isLoadingMore: false,
  isRemovingSites: false,
  showAddSite: false,
  showConfirmRemoveSites: false,
  sites: {
    data: [],
    totalCount: 0,
  },
});

const selectedSitesCount = computed(() =>
  state.sites.data.reduce((total, site) => {
    if (site.selected) total++;
    return total;
  }, 0),
);

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

    state.sites.totalCount += added;

    const existingIds = new Set(state.sites.data.map((site) => site.id));
    state.sites.data = state.sites.data.concat(
      sites
        .filter((site) => !existingIds.has(site.id))
        .map((site) => ({ ...site, selected: false })),
    );
    state.sites.data.sort((a, b) => a.name.localeCompare(b.name));

    toasts.toast({
      id: 'operator-sites-added',
      message: `Added ${added} dive sites to ${props.operator.name}.`,
      type: ToastType.Success,
    });

    state.showAddSite = false;
  });

  state.isAddingSites = false;
}

async function onRemoveSelected() {
  state.showConfirmRemoveSites = true;
}

function onCancelRemoveSelected() {
  state.showConfirmRemoveSites = false;
}

async function onConfirmRemoveSelected(): Promise<void> {
  state.isRemovingSites = true;

  await oops(async () => {
    const removed = await client.operators.removeDiveSites(
      props.operator.slug,
      state.sites.data.filter((site) => site.selected).map((site) => site.id),
    );

    state.sites.totalCount -= removed;
    state.sites.data = state.sites.data.filter((site) => !site.selected);

    toasts.toast({
      id: 'operator-sites-removed',
      message: `Removed ${removed} dive sites from ${props.operator.name}.`,
      type: ToastType.Success,
    });

    state.showConfirmRemoveSites = false;
  });

  state.isRemovingSites = false;
}

async function refreshSitesList(): Promise<void> {
  state.isLoading = true;

  await oops(async () => {
    state.sites = await client.operators.listDiveSites(props.operator.slug);
  });

  state.isLoading = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const moreSites = await client.operators.listDiveSites(
      props.operator.slug,
      { skip: state.sites.data.length },
    );

    state.sites.data.push(...moreSites.data);
    state.sites.totalCount = moreSites.totalCount;
  });

  state.isLoadingMore = false;
}

onMounted(refreshSitesList);
</script>
