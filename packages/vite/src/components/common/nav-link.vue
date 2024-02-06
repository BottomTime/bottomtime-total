<template>
  <a
    class="font-bold text-link underline hover:text-link-hover"
    :href="to"
    :target="newTab ? '_blank' : '_self'"
    :aria-label="label"
    @click="$emit('click')"
  >
    <slot></slot>
  </a>
</template>

<script setup lang="ts">
type NavLinkProps = {
  to: string;
  label?: string;
  newTab?: boolean;
};

withDefaults(defineProps<NavLinkProps>(), {
  newTab: false,
});
defineEmits<{
  (e: 'click'): void;
}>();
</script>
