<template>
  <section class="section">
    <footer class="footer">
      <div class="container">
        <div class="content has-text-centered">
          <p>Copyright &copy; Chris Carleton, {{ year }}</p>
        </div>
      </div>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
const year = computed(() => new Date().getFullYear());
</script>
