<template>
  <PageTitle title="Export Logbook" />
  <BreadCrumbs :items="breadcrumbs" />

  <div class="grid grid-cols-4 gap-3">
    <div>
      <LogbookSearch :params="state.searchParams" @search="onSearch" />
    </div>

    <div class="col-span-3">
      <LoadingSpinner
        v-if="state.isLoading"
        message="Fetching log entries..."
      />
      <div v-else>
        <FormBox class="top-16 sticky flex justify-between items-center">
          <div class="flex gap-2 items-baseline">
            <p>
              <span>Exporting </span>
              <span class="font-bold">{{ selectedCount }}</span>
              <span> of </span>
              <span class="font-bold">{{ state.entries.totalCount }}</span>
              <span> log entries.</span>
            </p>

            <LoadingSpinner
              v-if="state.isLoadingRemaining"
              class="text-sm"
              message="Fetching remaining entries..."
            />
            <a
              v-else-if="state.entries.data.length < state.entries.totalCount"
              class="text-sm"
              @click="loadRemaining"
            >
              Load remaining...
            </a>
          </div>

          <div class="flex gap-2">
            <div>
              <FormButton rounded="left" @click="selectAll">
                Select All
              </FormButton>
              <FormButton rounded="right" @click="selectNone">
                Select None
              </FormButton>
            </div>
            <FormButton type="primary" :disabled="selectedCount === 0">
              Export Log Entries...
            </FormButton>
          </div>
        </FormBox>

        <TransitionList class="mx-2">
          <ExportLogbookListItem
            v-for="entry in state.entries.data"
            :key="entry.id"
            :entry="entry"
            @toggle-select="onToggleSelect"
          />
        </TransitionList>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ApiList,
  ListLogEntriesParamsDTO,
  VerySuccinctLogEntryDTO,
} from '@bottomtime/api';

import { useClient } from 'src/api-client';
import { Breadcrumb, Selectable } from 'src/common';
import BreadCrumbs from 'src/components/common/bread-crumbs.vue';
import FormBox from 'src/components/common/form-box.vue';
import FormButton from 'src/components/common/form-button.vue';
import LoadingSpinner from 'src/components/common/loading-spinner.vue';
import PageTitle from 'src/components/common/page-title.vue';
import TransitionList from 'src/components/common/transition-list.vue';
import ExportLogbookListItem from 'src/components/logbook/export-logbook-list-item.vue';
import LogbookSearch from 'src/components/logbook/logbook-search.vue';
import { useOops } from 'src/oops';
import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

interface ExportLogbookViewState {
  entries: ApiList<Selectable<VerySuccinctLogEntryDTO>>;
  isLoading: boolean;
  isLoadingRemaining: boolean;
  searchParams: ListLogEntriesParamsDTO;
}

const client = useClient();
const oops = useOops();
const route = useRoute();

const logbookOwner = computed(() =>
  typeof route.params.username === 'string'
    ? route.params.username
    : route.params.username[0],
);
const breadcrumbs = computed<Breadcrumb[]>(() => [
  { label: 'Logbook', to: `/logbook/${logbookOwner.value}` },
  { label: 'Export Logbook', active: true },
]);
const state = reactive<ExportLogbookViewState>({
  entries: {
    data: [],
    totalCount: 0,
  },
  isLoading: true,
  isLoadingRemaining: false,
  searchParams: {},
});

const selectedCount = computed(() =>
  state.entries.data.reduce((total, entry) => {
    return entry.selected ? total + 1 : total;
  }, 0),
);

async function refresh(): Promise<void> {
  state.isLoading = true;

  await oops(async () => {
    state.entries = await client.logEntries.listLogEntriesSuccinct(
      logbookOwner.value,
      { ...state.searchParams, limit: 200 },
    );
    state.entries.data.forEach((entry) => {
      entry.selected = true;
    });
  });

  state.isLoading = false;
}

async function onSearch(newParams: ListLogEntriesParamsDTO): Promise<void> {
  state.searchParams = newParams;
  await refresh();
}

async function loadRemaining(): Promise<void> {
  state.isLoadingRemaining = true;

  await oops(async () => {
    while (state.entries.data.length < state.entries.totalCount) {
      const newEntries = await client.logEntries.listLogEntriesSuccinct(
        logbookOwner.value,
        {
          ...state.searchParams,
          limit: 500,
          skip: state.entries.data.length,
        },
      );

      state.entries.totalCount = newEntries.totalCount;
      state.entries.data.push(
        ...newEntries.data.map((entry) => ({ ...entry, selected: true })),
      );
    }
  });

  state.isLoadingRemaining = false;
}

function onToggleSelect(
  entry: Selectable<VerySuccinctLogEntryDTO>,
  selected: boolean,
): void {
  entry.selected = selected;
}

function selectAll() {
  state.entries.data.forEach((entry) => {
    entry.selected = true;
  });
}

function selectNone() {
  state.entries.data.forEach((entry) => {
    entry.selected = false;
  });
}

onMounted(refresh);
</script>
