<template>
  <footer id="app-footer" class="footer">
    <div class="container has-text-centered">
      <p id="app-footer-copyright" class="content block">
        Copyright &copy; Chris Carleton, {{ year }}
      </p>
      <div id="app-footer-contact" class="columns">
        <div class="column is-one-quarter-tablet is-offset-one-quarter-tablet">
          <span class="icon-text">
            <span class="icon">
              <i class="fas fa-envelope"></i>
            </span>
            <span>
              <a :href="`mailto:${config.adminEmail}`">{{
                config.adminEmail
              }}</a>
            </span>
          </span>
        </div>
        <div class="column is-one-quarter-tablet">
          <RouterLink to="/privacy">Privacy Policy</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import config from '@/config';

const year = computed(() => new Date().getFullYear());
</script>
