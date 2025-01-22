<template>
  <p
    :class="`rounded-full bg-secondary text-grey-900 flex items-center gap-1 ${height} ${width}`"
  >
    <span class="relative">
      <img
        class="rounded-full"
        :width="size"
        :height="size"
        alt=""
        :src="avatar"
        :data-testid="testId"
      />
      <span
        v-if="(profile?.accountTier ?? 0) > AccountTier.Basic"
        class="absolute -bottom-1.5 mx-auto text-xs bg-warn-hover rounded-full text-grey-900 w-8 h-4 text-center"
      >
        PRO
      </span>
    </span>
    <span v-if="showName" :class="`pr-2 ${fontSize}`">
      {{ profile?.name || `@${profile?.username}` }}
    </span>
  </p>
</template>

<script setup lang="ts">
/* eslint-disable deprecation/deprecation */
import { AccountTier, AvatarSize, SuccinctProfileDTO } from '@bottomtime/api';

import { computed } from 'vue';

import { getAvatarURL } from '../../avatars';

type UserAvatarProps = {
  /** @deprecated Use the `profile` property instead. */
  avatar?: string;

  /** @deprecated Use the `profile` property instead. */
  displayName?: string;

  size?: 'x-small' | 'small' | 'medium' | 'large' | 'x-large';
  profile?: SuccinctProfileDTO;
  showName?: boolean;
  testId?: string;
};

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: 'small',
  showName: false,
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

const height = computed(() => `h-[${size.value}]`);
const width = computed(() => (props.showName ? `w-auto` : `w-[${size.value}]`));

const fontSize = computed(() => {
  switch (props.size) {
    case 'x-large':
      return 'text-4xl';

    case 'large':
      return 'text-2xl';

    case 'medium':
      return 'text-lg';

    case 'x-small':
      return 'text-xs';

    case 'small':
    default:
      return 'text-sm';
  }
});

function getSizedAvatarURL(baseUrl: string): string | undefined {
  switch (props.size) {
    case 'x-large':
      return getAvatarURL(baseUrl, AvatarSize.XLarge);

    case 'large':
      return getAvatarURL(baseUrl, AvatarSize.Large);

    case 'medium':
      return getAvatarURL(baseUrl, AvatarSize.Medium);

    case 'x-small':
      return getAvatarURL(baseUrl, AvatarSize.Small);

    case 'small':
    default:
      return getAvatarURL(baseUrl, AvatarSize.Small);
  }
}

const avatar = computed(() => {
  if (props.profile) {
    return props.profile.avatar
      ? getSizedAvatarURL(props.profile.avatar)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          props.profile.name || props.profile.username,
        )}`;
  }

  if (!props.avatar) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      props.displayName || 'user',
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
