<template>
  <a
    class="font-bold text-link underline hover:text-link-hover"
    :href="to"
    :target="target"
    :aria-label="label"
    @click="$emit('click')"
  >
    <slot></slot>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type NavLinkProps = {
  to: string;
  label?: string;
  newTab?: boolean;
};

const props = withDefaults(defineProps<NavLinkProps>(), {
  newTab: false,
});
defineEmits<{
  (e: 'click'): void;
}>();
const target = computed<string | undefined>(() =>
  props.newTab ? '_blank' : undefined,
);
</script>
