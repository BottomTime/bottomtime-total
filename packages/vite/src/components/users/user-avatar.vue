<template>
  <img class="rounded-full" :width="size" :height="size" alt="" :src="avatar" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UserAvatarProps = {
  avatar?: string;
  displayName: string;
  size?: 'small' | 'medium' | 'large' | 'x-large';
};

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: 'small',
});
const avatar = computed(
  () =>
    props.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(props.displayName)}`,
);
const size = computed(() => {
  switch (props.size) {
    case 'x-large':
      return '256px';

    case 'large':
      return '128px';

    case 'medium':
      return '64px';

    case 'small':
    default:
      return '32px';
  }
});
</script>
