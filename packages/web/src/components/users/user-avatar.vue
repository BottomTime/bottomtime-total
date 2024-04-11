<template>
  <img
    class="rounded-full"
    :width="size"
    :height="size"
    alt=""
    :src="avatar"
    :data-testid="testId"
  />
</template>

<script setup lang="ts">
import { AvatarSize } from '@bottomtime/api';

import { computed } from 'vue';

import { getAvatarURL } from '../../avatars';

type UserAvatarProps = {
  avatar?: string;
  displayName: string;
  size?: 'x-small' | 'small' | 'medium' | 'large' | 'x-large';
  testId?: string;
};

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: 'small',
});

const size = computed(() => {
  switch (props.size) {
    case 'x-large':
      return '256px';

    case 'large':
      return '128px';

    case 'medium':
      return '64px';

    case 'x-small':
      return '24px';

    case 'small':
    default:
      return '32px';
  }
});

const avatar = computed(() => {
  if (!props.avatar) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      props.displayName,
    )}`;
  }

  switch (props.size) {
    case 'x-large':
      return getAvatarURL(props.avatar, AvatarSize.XLarge);

    case 'large':
      return getAvatarURL(props.avatar, AvatarSize.Large);

    case 'medium':
      return getAvatarURL(props.avatar, AvatarSize.Medium);

    default:
      return getAvatarURL(props.avatar, AvatarSize.Small);
  }
});
</script>
