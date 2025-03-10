<template>
  <a
    :href="`/profile/${profile?.username}`"
    target="_blank"
    rel="noopener noreferrer"
    :class="`no-style group relative rounded-full bg-gradient-to-b from-link to-link-hover text-grey-900 flex items-center gap-1.5 ${height} ${width} shadow-inner shadow-grey-800 cursor-pointer`"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
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
        class="absolute -bottom-1 mx-auto text-xs bg-warn-hover rounded-full text-grey-900 w-8 h-4 text-center"
      >
        PRO
      </span>
    </span>
    <span v-if="showName" :class="`pr-2 font-bold ${fontSize}`">
      {{ profile?.name || `@${profile?.username}` }}
    </span>

    <div
      v-if="profile"
      class="absolute top-[105%] left-2 min-w-80 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 flex flex-wrap bg-secondary-dark p-1 rounded-md shadow-lg shadow-grey-800/60 text-xs z-[55] transition-opacity ease-in-out duration-200"
    >
      <label class="font-bold text-right w-1/5">Joined:</label>
      <span class="w-4/5 px-1 text-pretty">
        {{ dayjs(profile?.memberSince).fromNow() }}
      </span>

      <label class="font-bold text-right w-1/5">Username:</label>
      <span class="w-4/5 px-1 text-pretty">@{{ profile.username }}</span>

      <label class="font-bold text-right w-1/5">Location:</label>
      <span class="w-4/5 px-1 text-pretty">
        {{ profile.location || 'Not specified' }}
      </span>

      <template v-if="fullProfile">
        <label class="font-bold text-right w-1/5">Diving since:</label>
        <span class="w-4/5 px-1 text-pretty">
          {{ fullProfile.startedDiving || 'Not specified' }}
        </span>

        <label class="font-bold text-right w-1/5">Experience:</label>
        <span class="w-4/5 px-1 text-pretty">
          {{ fullProfile.experienceLevel || 'Not specified' }}
        </span>

        <label class="font-bold text-right w-1/5">Bio:</label>
        <span class="w-4/5 px-1 text-pretty">
          {{ fullProfile.bio || 'Not specified' }}
        </span>
      </template>
    </div>
  </a>
</template>

<script setup lang="ts">
/* eslint-disable deprecation/deprecation */
import {
  AccountTier,
  AvatarSize,
  ProfileDTO,
  SuccinctProfileDTO,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, ref } from 'vue';

import { useClient } from '../../api-client';
import { getAvatarURL } from '../../avatars';
import { useOops } from '../../oops';

type UserAvatarProps = {
  /** @deprecated Use the `profile` property instead. */
  avatar?: string;

  /** @deprecated Use the `profile` property instead. */
  displayName?: string;

  size?: 'x-small' | 'small' | 'medium' | 'large' | 'x-large';
  profile?: SuccinctProfileDTO | ProfileDTO;
  showName?: boolean;
  testId?: string;
};

const client = useClient();
const oops = useOops();

const props = withDefaults(defineProps<UserAvatarProps>(), {
  size: 'small',
  showName: false,
});
const profileTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const fullProfile = ref<ProfileDTO | null>(null);

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
const width = computed(() => (props.showName ? `w-fit` : `w-[${size.value}]`));

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

async function fetchFullProfile(): Promise<void> {
  await oops(async () => {
    if (!props.profile) return;
    fullProfile.value = await client.userProfiles.getProfile(
      props.profile.username,
    );
  });
}

function onMouseEnter() {
  if (fullProfile.value) return;
  profileTimer.value = setTimeout(async () => {
    profileTimer.value = null;
    await fetchFullProfile();
  }, 1000);
}

function onMouseLeave() {
  if (profileTimer.value) {
    clearTimeout(profileTimer.value);
  }
}
</script>
