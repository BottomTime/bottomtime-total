<template>
  <li :class="classes">
    <RouterLink
      class="no-style w-full md:w-auto no-underline font-title text-grey-300 hover:text-grey-50"
      :data-testid="testId"
      :to="to"
      @click="$emit('click')"
    >
      {{ title }}
    </RouterLink>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

type NavBarLinkProps = {
  to: string;
  title: string;
  testId?: string;
};

const route = useRoute();

const props = defineProps<NavBarLinkProps>();
const classes = computed(() => {
  const active = route.path === props.to;
  return `text-lg hover:text-blue-300${
    active ? ' text-blue-400 font-bold' : ''
  }`;
});

defineEmits<{
  (e: 'click'): void;
}>();
</script>
