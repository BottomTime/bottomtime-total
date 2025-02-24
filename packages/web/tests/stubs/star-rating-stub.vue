<template>
  <div>
    {{ rating }}
  </div>
</template>

<script lang="ts" setup>
const rating = defineModel<number>({ required: false, default: 0 });
</script>
