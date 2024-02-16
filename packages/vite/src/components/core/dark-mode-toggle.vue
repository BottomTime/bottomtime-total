<template>
  <label class="relative cursor-pointer" aria-label="Toggle dark mode">
    <input v-model="darkMode" type="checkbox" class="sr-only peer" />
    <div
      class="flex flex-row gap-4 items-center align-middle ring-1 ring-offset-1 h-6 pl-1 pr-1 ring-blue-400 shadow-sm rounded-full bg-gradient-to-t from-blue-400 to-blue-200 dark:from-blue-800 dark:to-blue-950 hover:shadow-md"
    >
      <span class="text-warn dark:text-grey-500">
        <i class="fas fa-sun fa-sm"></i>
      </span>
      <span class="text-grey-500 dark:text-blue-300">
        <i class="fas fa-moon fa-sm"></i>
      </span>
    </div>
  </label>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue';

const darkMode = ref(false);

watch(darkMode, (value) => {
  document.documentElement.classList.toggle('dark', value);
  localStorage.setItem('darkMode', value.toString());
});

// Check the browser's local storage for the stored dark mode preference.
// For first view (or if no setting is stored) default to the operating system's dark mode setting.
onBeforeMount(() => {
  const storedValue = localStorage.getItem('darkMode');
  if (storedValue === null) {
    darkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else if (storedValue === 'true') {
    darkMode.value = true;
  } else {
    darkMode.value = false;
  }
});
</script>
