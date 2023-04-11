<template>
  <footer id="app-footer" class="footer">
    <div class="container has-text-centered">
      <p id="app-footer-copyright" class="content block">
        Copyright &copy; Chris Carleton, {{ year }}
      </p>
      <p id="app-footer-contact" class="content block">
        <span class="icon-text">
          <span class="icon">
            <i class="fas fa-envelope fa-sm"></i>
          </span>
          <span>
            <a :href="`mailto:${config.adminEmail}`">{{ config.adminEmail }}</a>
          </span>
        </span>
      </p>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import config from '@/config';

const year = computed(() => new Date().getFullYear());
</script>
