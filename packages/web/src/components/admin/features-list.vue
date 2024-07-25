<template>
  <div class="space-y-3">
    <FormBox class="flex justify-between items-baseline">
      <p>
        <span>Showing </span>
        <span class="font-bold font-mono">{{ features.length }}</span>
        <span> feature flags</span>
      </p>

      <FormButton type="primary" @click="$emit('create')">
        Create New Flag
      </FormButton>
    </FormBox>

    <ul v-if="features.length" class="px-2">
      <FeaturesListItem
        v-for="feature in features"
        :key="feature.key"
        :feature="feature"
        :is-toggling="togglingKey === feature.key"
        @delete="(key) => $emit('delete', key)"
        @edit="(feature) => $emit('edit', feature)"
        @select="(feature) => $emit('edit', feature)"
        @toggle="(feature) => $emit('toggle', feature)"
      />
    </ul>

    <div v-else class="flex gap-3 justify-center py-6">
      <span>
        <i class="fa-solid fa-circle-exclamation"></i>
      </span>
      <p>
        No feature flags found. Create your first flag by clicking
        <NavLink @click="$emit('create')">here</NavLink>.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FeatureDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';
import FeaturesListItem from './features-list-item.vue';

interface FeaturesListProps {
  features: FeatureDTO[];
  togglingKey?: string;
}

defineProps<FeaturesListProps>();

defineEmits<{
  (e: 'create'): void;
  (e: 'delete', key: string): void;
  (e: 'edit', feature: FeatureDTO): void;
  (e: 'toggle', feature: FeatureDTO): void;
}>();
</script>
