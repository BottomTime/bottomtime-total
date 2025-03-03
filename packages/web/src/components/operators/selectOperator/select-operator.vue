<template>
  <TabsPanel
    :tabs="tabs"
    :active-tab="state.activeTab"
    @tab-changed="onTabChanged"
  >
    <RecentOperatorsList
      v-if="state.activeTab === SelectOperatorTabs.Recent"
      :current-operator="currentOperator"
      @switch-to-search="state.activeTab = SelectOperatorTabs.Search"
      @operator-selected="(operator) => $emit('operator-selected', operator)"
    />

    <SearchOperatorsForm
      v-else-if="state.activeTab === SelectOperatorTabs.Search"
      @operator-selected="(operator) => $emit('operator-selected', operator)"
    />
  </TabsPanel>
</template>

<script lang="ts" setup>
import { OperatorDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import { TabInfo } from '../../../common';
import TabsPanel from '../../common/tabs-panel.vue';
import RecentOperatorsList from './recent-operators-list.vue';
import SearchOperatorsForm from './search-operators-form.vue';

enum SelectOperatorTabs {
  Recent = 'recent',
  Search = 'search',
  Create = 'create',
}

interface SelectOperatorState {
  activeTab: SelectOperatorTabs;
}

interface SelectOperatorProps {
  currentOperator?: OperatorDTO;
}

const tabs: TabInfo[] = [
  { key: SelectOperatorTabs.Recent, label: 'Recent Operators' },
  { key: SelectOperatorTabs.Search, label: 'Search Operators' },
];

defineProps<SelectOperatorProps>();
defineEmits<{
  (e: 'operator-selected', operator: OperatorDTO): void;
}>();
const state = reactive<SelectOperatorState>({
  activeTab: SelectOperatorTabs.Recent,
});

function onTabChanged(key: string) {
  state.activeTab = key as SelectOperatorTabs;
}
</script>
