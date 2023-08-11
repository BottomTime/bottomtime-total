<template>
  <section class="hero is-dark">
    <div class="hero-body">
      <div class="container">
        <p class="title">{{ title }}</p>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        <slot></slot>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

const props = defineProps<PageTitleProps>();

onMounted(() => {
  document.title = `BottomTime | ${props.title}`;
});
</script>
