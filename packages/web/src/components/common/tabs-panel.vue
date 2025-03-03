<template>
  <div>
    <ul class="flex flex-row" role="tablist">
      <li v-for="tab in visibleTabs" :key="tab.key" :class="tabStyle(tab.key)">
        <button
          :id="`tab-${tab.key}`"
          :data-testid="`tab-${tab.key}`"
          :disabled="tab.disabled || isActive(tab.key)"
          role="tab"
          :aria-selected="isActive(tab.key)"
          @click="$emit('tab-changed', tab.key)"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>
    <div
      :class="`bg-blue-400 dark:bg-blue-800 p-3 rounded-b-md rounded-tr-md shadow-md shadow-grey-800 ${
        activeTab === visibleTabs[0]?.key ? '' : 'rounded-tl-md'
      }`"
      role="tabpanel"
      :aria-labelledby="labelledBy"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { TabInfo } from '../../common';

type TabsPanelProps = {
  tabs: TabInfo[];
  activeTab?: string;
};

const BaseTabStyle =
  'font-title p-2 hover:text-blue-500 hover:dark:text-blue-500';
const inactiveTabStyle = `${BaseTabStyle} text-gray-500`;
const activeTabStyle = `${BaseTabStyle} text-blue-800 dark:text-blue-300 font-bold rounded-t-md bg-blue-400 dark:bg-blue-800`;

const props = defineProps<TabsPanelProps>();
defineEmits<{
  (e: 'tab-changed', key: string): void;
}>();

const labelledBy = computed(() =>
  props.activeTab ? `tab-${props.activeTab}` : undefined,
);

const visibleTabs = computed(() =>
  props.tabs.filter((tab) => tab.visible !== false),
);

function isActive(key: string): boolean {
  return key === props.activeTab;
}

function tabStyle(key: string): string {
  return isActive(key) ? activeTabStyle : inactiveTabStyle;
}
</script>
