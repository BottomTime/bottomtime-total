<template>
  <HeroSection />
  <div class="grid lg:grid-cols-2 gap-4">
    <AlertsCarousel />
  </div>
</template>

<script setup lang="ts">
import AlertsCarousel from '../components/home/alerts-carousel.vue';
import HeroSection from '../components/home/hero-section.vue';
</script>
