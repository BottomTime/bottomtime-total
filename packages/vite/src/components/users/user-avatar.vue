<template>
  <img class="rounded-full w-8 h-8" alt="" :src="avatar" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UserAvatarProps = {
  avatar?: string;
  displayName: string;
};

const props = defineProps<UserAvatarProps>();
const avatar = computed(
  () =>
    props.avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(props.displayName)}`,
);
</script>
