<template>
  <div class="space-y-3">
    <div class="sticky top-16">
      <FormBox class="flex justify-between items-baseline">
        <p>
          <span>Showing </span>
          <span class="font-bold">{{ operators.operators.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ operators.totalCount }}</span>
          <span> dive operators</span>
        </p>

        <div>
          <FormButton
            v-if="isShopOwner"
            type="primary"
            @click="$emit('create-shop')"
          >
            Add a Dive Shop
          </FormButton>
        </div>
      </FormBox>
    </div>

    <ul class="px-2">
      <DiveOperatorsListItem
        v-for="operator in operators.operators"
        :key="operator.slug"
        :operator="operator"
        @select="(dto) => $emit('select', dto)"
      />

      <li
        v-if="isLoadingMore"
        class="flex justify-center gap-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
      >
        <LoadingSpinner message="Loading more results..." />
      </li>

      <li
        v-else-if="operators.operators.length < operators.totalCount"
        class="flex justify-center gap-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
      >
        <FormButton type="link" @click="$emit('load-more')">
          <p class="text-lg italic">Load more results...</p>
        </FormButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {
  AccountTier,
  DiveOperatorDTO,
  SearchDiveOperatorsResponseDTO,
} from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import DiveOperatorsListItem from './dive-operators-list-item.vue';

interface DiveOperatorsListProps {
  isLoadingMore?: boolean;
  operators: SearchDiveOperatorsResponseDTO;
}

const currentUser = useCurrentUser();
const isShopOwner = computed(
  () => (currentUser.user?.accountTier || 0) >= AccountTier.ShopOwner,
);

withDefaults(defineProps<DiveOperatorsListProps>(), {
  isLoadingMore: false,
});

defineEmits<{
  (e: 'create-shop'): void;
  (e: 'load-more'): void;
  (e: 'select', operator: DiveOperatorDTO): void;
}>();
</script>
