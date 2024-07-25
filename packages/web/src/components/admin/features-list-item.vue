<template>
  <li
    class="flex space-x-3 min-h-24 items-center even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="flex flex-col gap-2 w-full">
      <!-- Header -->
      <div class="flex items-baseline gap-3">
        <FormButton
          :control-id="`select-${feature.key}`"
          :test-id="`select-${feature.key}`"
          type="link"
          size="2xl"
          @click="$emit('select', feature)"
        >
          {{ feature.name }}
        </FormButton>
        <span class="text-sm font-mono">({{ feature.key }})</span>
      </div>

      <div class="flex justify-between">
        <!-- Metadata -->
        <div>
          <p v-if="feature.description">
            {{ feature.description }}
          </p>

          <div class="flex gap-12">
            <div>
              <p class="font-bold">Created:</p>
              <p class="italic">{{ dayjs(feature.createdAt).format('LLL') }}</p>
            </div>

            <div>
              <p class="font-bold">Last updated:</p>
              <p class="italic">{{ dayjs(feature.updatedAt).format('LLL') }}</p>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-2">
          <div class="pt-2 pr-3">
            <p
              v-if="isToggling"
              :data-testid="`toggling-${feature.key}`"
              class="px-8"
            >
              <i class="fa-solid fa-spinner fa-spin"></i>
            </p>
            <FormToggle
              v-else
              :control-id="`toggle-${feature.key}`"
              :test-id="`toggle-${feature.key}`"
              :model-value="feature.enabled"
              :label="feature.enabled ? 'On' : 'Off'"
              @update:model-value="$emit('toggle', feature)"
            />
          </div>

          <FormButton
            :control-id="`edit-${feature.key}`"
            :test-id="`edit-${feature.key}`"
            @click="$emit('edit', feature)"
          >
            <span class="sr-only">Edit flag: {{ feature.name }}</span>
            <span>
              <i class="fa-solid fa-pencil"></i>
            </span>
          </FormButton>
          <FormButton
            :control-id="`delete-${feature.key}`"
            :test-id="`delete-${feature.key}`"
            type="danger"
            @click="$emit('delete', feature.key)"
          >
            <span class="sr-only">Delete flag: {{ feature.name }}</span>
            <span>
              <i class="fa-solid fa-trash"></i>
            </span>
          </FormButton>
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FeatureDTO } from '@bottomtime/api';

import dayjs from 'dayjs';

import FormButton from '../common/form-button.vue';
import FormToggle from '../common/form-toggle.vue';

interface FeaturesListItemProps {
  feature: FeatureDTO;
  isToggling?: boolean;
}

withDefaults(defineProps<FeaturesListItemProps>(), {
  isToggling: false,
});

defineEmits<{
  (e: 'edit', feature: FeatureDTO): void;
  (e: 'delete', key: string): void;
  (e: 'select', feature: FeatureDTO): void;
  (e: 'toggle', feature: FeatureDTO): void;
}>();
</script>
