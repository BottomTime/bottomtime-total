<template>
  <div class="space-y-3">
    <div class="sticky top-16">
      <FormBox class="flex justify-between items-baseline">
        <p data-testid="operators-count">
          <span>Showing </span>
          <span class="font-bold">{{ operators.operators.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ operators.totalCount }}</span>
          <span> dive shop(s)</span>
        </p>

        <div>
          <FormButton
            v-if="isShopOwner"
            type="primary"
            test-id="operators-create-shop"
            @click="$emit('create-shop')"
          >
            Create a Dive Shop
          </FormButton>
        </div>
      </FormBox>
    </div>

    <ul class="px-2" data-testid="operators-list">
      <OperatorsListItem
        v-for="operator in operators.operators"
        :key="operator.slug"
        :operator="operator"
        @select="(dto) => $emit('select', dto)"
      />

      <li v-if="isLoading" class="my-8 text-xl text-center">
        <LoadingSpinner message="Loading dive shops..." />
      </li>

      <template v-else>
        <li
          v-if="!operators.operators.length"
          class="my-8"
          data-testid="operators-no-results"
        >
          <p class="text-xl text-center space-x-3">
            <span>
              <i class="fa-solid fa-magnifying-glass"></i>
            </span>
            <span class="italic">
              There are no dive shops that match your search criteria.
            </span>
          </p>
        </li>

        <li
          v-if="isLoadingMore"
          class="flex justify-center gap-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
          data-testid="operators-loading"
        >
          <LoadingSpinner message="Loading more results..." />
        </li>

        <li
          v-else-if="operators.operators.length < operators.totalCount"
          class="flex justify-center gap-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
        >
          <FormButton
            type="link"
            test-id="operators-load-more"
            @click="$emit('load-more')"
          >
            <p class="text-lg italic">Load more results...</p>
          </FormButton>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {
  AccountTier,
  OperatorDTO,
  SearchOperatorsResponseDTO,
  UserRole,
} from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import OperatorsListItem from './operators-list-item.vue';

interface OperatorsListProps {
  isLoading?: boolean;
  isLoadingMore?: boolean;
  operators: SearchOperatorsResponseDTO;
}

const currentUser = useCurrentUser();
const isShopOwner = computed(
  () =>
    (currentUser.user?.accountTier || 0) >= AccountTier.ShopOwner ||
    currentUser.user?.role === UserRole.Admin,
);

withDefaults(defineProps<OperatorsListProps>(), {
  isLoading: false,
  isLoadingMore: false,
});

defineEmits<{
  (e: 'create-shop'): void;
  (e: 'load-more'): void;
  (e: 'select', operator: OperatorDTO): void;
}>();
</script>
