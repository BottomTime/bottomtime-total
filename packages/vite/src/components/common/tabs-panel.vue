<template>
  <div>
    <ul class="flex flex-row" role="tablist">
      <li v-for="tab in tabs" :key="tab.key" :class="tabStyle(tab.key)">
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
    <FormBox rounding="bottom" role="tabpanel" :aria-labelledby="labelledBy">
      <slot></slot>
    </FormBox>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { TabInfo } from '../../common';
import FormBox from './form-box.vue';

type TabsPanelProps = {
  tabs: TabInfo[];
  activeTab?: string;
};

const BaseTabStyle =
  'font-title p-2 hover:text-blue-500 hover:dark:text-blue-500';
const inactiveTabStyle = `${BaseTabStyle} text-gray-500`;
const activeTabStyle = `${BaseTabStyle} text-blue-800 dark:text-blue-300 font-bold rounded-t-md bg-blue-300 dark:bg-blue-900`;

const props = defineProps<TabsPanelProps>();
defineEmits<{
  (e: 'tab-changed', key: string): void;
}>();
const labelledBy = computed(() =>
  props.activeTab ? `tab-${props.activeTab}` : undefined,
);

function isActive(key: string): boolean {
  return key === props.activeTab;
}

function tabStyle(key: string): string {
  return isActive(key) ? activeTabStyle : inactiveTabStyle;
}
</script>
