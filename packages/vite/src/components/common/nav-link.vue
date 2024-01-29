<template>
  <a
    class="font-bold text-link underline hover:text-link-hover"
    :href="to"
    :aria-label="label"
  >
    <slot></slot>
  </a>
</template>

<script setup lang="ts">
type NavLinkProps = {
  to: string;
  label?: string;
};

defineProps<NavLinkProps>();
</script>
