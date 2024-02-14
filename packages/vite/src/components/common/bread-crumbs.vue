<template>
  <ul class="flex flex-row gap-5 font-bold text-link mb-4">
    <li>
      <NavLink to="/">Home</NavLink>
    </li>
    <li v-for="(item, index) in items" :key="index">
      <span class="mr-5">
        <i class="fas fa-angle-right"></i>
      </span>
      <NavLink v-if="item.to" :to="item.to">{{
        typeof item.label === 'string' ? item.label : item.label()
      }}</NavLink>
      <span v-else>{{
        typeof item.label === 'string' ? item.label : item.label()
      }}</span>
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
</script>
