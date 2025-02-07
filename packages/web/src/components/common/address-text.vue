<template>
  <div class="inline">
    <p v-for="(line, index) in addressLines" :key="index" class="capitalize">
      {{ line }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface AddressTextProps {
  address?: string;
}

const props = withDefaults(defineProps<AddressTextProps>(), {
  address: '',
});

const addressLines = computed(() =>
  props.address.split(',').map((part) => part.trim()),
);
</script>
