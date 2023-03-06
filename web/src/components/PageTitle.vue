<template>
  <section class="hero is-info">
    <div class="hero-body">
      <div class="container">
        <p class="title">{{ title }}</p>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

defineProps<PageTitleProps>();
</script>
