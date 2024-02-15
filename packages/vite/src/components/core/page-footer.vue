<template>
  <section
    class="font-content text-grey-700 dark:text-grey-200 text-center h-36 pt-8"
  >
    <p class="text-sm italic p-3">Copyright &copy; Chris Carleton, 2024</p>
    <ul class="text-xs flex flex-wrap justify-center">
      <li class="p-0.5"><a href="/privacy">Privacy Policy</a></li>
      <li class="p-0.5">|</li>
      <li class="p-0.5"><a href="/termsOfService">Terms of Service</a></li>
      <li class="p-0.5">|</li>
      <li class="p-0.5"><a href="/cookies">Cookie Policy</a></li>
      <li class="p-0.5">|</li>
      <li class="p-0.5">
        <a :href="adminEmail">Contact</a>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Config } from '../../config';

const adminEmail = computed(() => `mailto:${Config.adminEmail}`);
</script>
