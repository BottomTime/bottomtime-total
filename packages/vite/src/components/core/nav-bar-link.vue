<template>
  <li
    :class="`text-lg hover:text-blue-300 ${
      active && 'text-blue-400 font-bold'
    }`"
  >
    <a
      class="w-full md:w-auto"
      :data-testid="testId"
      :href="to"
      @click="$emit('click')"
      >{{ title }}</a
    >
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

type NavBarLinkProps = {
  to: string;
  title: string;
  testId?: string;
};

const router = useRouter();

const props = defineProps<NavBarLinkProps>();
const active = computed(() => router.currentRoute.value.path === props.to);

defineEmits<{
  (e: 'click'): void;
}>();
</script>
