<template>
  <div>
    <ul class="flex flex-row">
      <li
        v-for="tab in tabs"
        :key="tab.key"
        :class="isActive(tab.key) ? activeTabStyle : inactiveTabStyle"
      >
        <button :disabled="isActive(tab.key)" @click="onTabChanging(tab.key)">
          {{ tab.label }}
        </button>
      </li>
    </ul>
    <FormBox rounding="bottom">
      <slot></slot>
    </FormBox>
  </div>
</template>

<script setup lang="ts">
import { TabInfo } from '../../common';
import FormBox from './form-box.vue';

type TabsPanelProps = {
  tabs: TabInfo[];
  activeTab?: string;
};

const BaseTabStyle = 'font-title p-2 hover:text-blue-300';
const inactiveTabStyle = `${BaseTabStyle} text-gray-500`;
const activeTabStyle = `${BaseTabStyle} text-blue-400 font-bold rounded-t-md bg-blue-100 dark:bg-blue-900`;

const props = defineProps<TabsPanelProps>();
const emit = defineEmits<{
  (e: 'tab-changing', key: string, cancel: () => void): void;
  (e: 'tab-changed', key: string): void;
}>();

function isActive(key: string) {
  return key === props.activeTab;
}

function onTabChanging(key: string) {
  let cancel = false;
  emit('tab-changing', key, () => {
    cancel = true;
  });

  if (cancel) return;
  emit('tab-changed', key);
}
</script>
