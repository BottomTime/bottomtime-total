<template>
  <section
    class="font-content text-grey-700 dark:text-grey-200 text-center h-36 mt-8"
  >
    <p class="text-sm">
      Copyright &copy; Chris Carleton, {{ new Date().getFullYear() }}
    </p>
    <ul class="text-sm flex flex-wrap justify-center *:p-0.5">
      <li><RouterLink to="/privacy">Privacy Policy</RouterLink></li>
      <li>|</li>
      <li><RouterLink to="/termsOfService">Terms of Service</RouterLink></li>
      <li>|</li>
      <li><RouterLink to="/cookies">Cookie Policy</RouterLink></li>
      <li>|</li>
      <li>
        <a :href="adminEmail">Contact</a>
      </li>
      <li>|</li>
      <li><RouterLink to="/developers">Developers</RouterLink></li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { Config } from '../../config';

const adminEmail = computed(() => `mailto:${Config.adminEmail}`);
</script>
