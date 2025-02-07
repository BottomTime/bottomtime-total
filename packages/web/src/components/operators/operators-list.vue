<template>
  <div class="space-y-3">
    <FormBox class="sticky top-16 flex justify-between items-baseline z-40">
      <p data-testid="operators-count">
        <span>Showing </span>
        <span class="font-bold">{{ operators.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ operators.totalCount }}</span>
        <span> dive shop(s)</span>
      </p>

      <div>
        <RouterLink v-if="isShopOwner" to="/shops/createNew">
          <FormButton type="primary" test-id="operators-create-shop">
            Create a Dive Shop
          </FormButton>
        </RouterLink>
      </div>
    </FormBox>

    <div class="w-full md:w-[640px] mx-auto aspect-video">
      <GoogleMap
        :center="mapCenter"
        :operators="operators.data"
        @operator-selected="onOperatorSelected"
      />
    </div>

    <TransitionList class="px-2" data-testid="operators-list">
      <OperatorsListItem
        v-for="operator in operators.data"
        ref="items"
        :key="operator.slug"
        :operator="operator"
        @select="(dto) => $emit('select', dto)"
        @delete="(dto) => $emit('delete', dto)"
      />

      <li v-if="isLoading" class="my-8 text-xl text-center">
        <LoadingSpinner message="Loading dive shops..." />
      </li>

      <template v-else>
        <li
          v-if="!operators.data.length"
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
          v-else-if="operators.data.length < operators.totalCount"
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
    </TransitionList>
  </div>
</template>

<script setup lang="ts">
import {
  AccountTier,
  ApiList,
  GpsCoordinates,
  OperatorDTO,
  UserRole,
} from '@bottomtime/api';

import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import GoogleMap from '../common/google-map.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TransitionList from '../common/transition-list.vue';
import OperatorsListItem from './operators-list-item.vue';

interface OperatorsListProps {
  isLoading?: boolean;
  isLoadingMore?: boolean;
  mapCenter?: GpsCoordinates;
  operators: ApiList<OperatorDTO>;
}

const items = ref<InstanceType<typeof OperatorsListItem>[]>([]);

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

const emit = defineEmits<{
  (e: 'load-more'): void;
  (e: 'select', operator: OperatorDTO): void;
  (e: 'delete', operator: OperatorDTO): void;
}>();

function onOperatorSelected(operator: OperatorDTO) {
  const item = items.value.find(
    (i) => i.$props.operator.slug === operator.slug,
  );
  item?.$el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  emit('select', operator);
}
</script>
