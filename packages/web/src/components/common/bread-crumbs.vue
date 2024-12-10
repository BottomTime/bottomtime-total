<template>
  <ul
    class="flex flex-row gap-5 font-bold text-link mb-4"
    data-testid="breadcrumbs"
  >
    <li>
      <RouterLink to="/">Home</RouterLink>
    </li>
    <li v-for="(item, index) in items" :key="index">
      <span class="mr-5">
        <i class="fas fa-angle-right"></i>
      </span>

      <span
        v-if="item.active"
        class="capitalize text-grey-800 dark:text-grey-200"
      >
        {{ itemLabel(item) }}
      </span>
      <RouterLink
        v-else-if="item.to"
        class="capitalize"
        :to="typeof item.to === 'string' ? item.to : item.to.value"
      >
        {{ itemLabel(item) }}
      </RouterLink>
      <span v-else>{{ itemLabel(item) }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router';

import { Breadcrumb } from '../../common';

type BreadCrumbsProps = {
  items: Breadcrumb[];
};

defineProps<BreadCrumbsProps>();

function itemLabel(item: Breadcrumb): string {
  return typeof item.label === 'string' ? item.label : item.label.value;
}
</script>
