<template>
  <li
    :class="`text-lg hover:text-blue-300${
      active ? ' text-blue-400 font-bold' : ''
    }`"
  >
    <a :href="to">{{ title }}</a>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

type NavBarLinkProps = {
  to: string;
  title: string;
};

const router = useRouter();

const props = defineProps<NavBarLinkProps>();
const active = computed(() => router.currentRoute.value.path === props.to);
</script>
