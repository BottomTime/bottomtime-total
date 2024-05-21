<template>
  <HeroSection />
  <div class="grid lg:grid-cols-2 gap-4">
    <AlertsCarousel class="col-span-1 lg:col-span-2" />
    <AppMetrics />
  </div>
</template>

<script setup lang="ts">
import AlertsCarousel from '../components/home/alerts-carousel.vue';
import AppMetrics from '../components/home/app-metrics.vue';
import HeroSection from '../components/home/hero-section.vue';
</script>
