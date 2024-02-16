<template>
  <ul
    class="flex flex-row gap-5 font-bold text-link mb-4"
    data-testid="breadcrumbs"
  >
    <li>
      <NavLink to="/">Home</NavLink>
    </li>
    <li v-for="(item, index) in items" :key="index">
      <span class="mr-5">
        <i class="fas fa-angle-right"></i>
      </span>

      <span v-if="item.active" class="text-grey-800 dark:text-grey-200">
        {{ itemLabel(item) }}
      </span>
      <NavLink v-else-if="item.to" :to="item.to">{{ itemLabel(item) }}</NavLink>
      <span v-else>{{ itemLabel(item) }}</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { Breadcrumb } from '../../common';
import NavLink from './nav-link.vue';

type BreadCrumbsProps = {
  items: Breadcrumb[];
};

defineProps<BreadCrumbsProps>();

function itemLabel(item: Breadcrumb): string {
  return typeof item.label === 'string' ? item.label : item.label();
}
</script>
