<template>
  <div class="flex flex-col justify-center space-y-3">
    <div class="w-[128px]">
      <UserAvatar
        :avatar="profile.avatar ?? undefined"
        :display-name="profile.name || `@${profile.username}`"
        size="large"
      />
    </div>

    <div>
      <p class="font-bold">Username:</p>
      <p class="italic">@{{ profile.username }}</p>
    </div>

    <div>
      <p class="font-bold">Joined:</p>
      <p class="italic">{{ dayjs(profile.memberSince).fromNow() }}</p>
    </div>

    <div v-if="profile.name">
      <p class="font-bold">Name:</p>
      <p class="italic" data-testid="profile-name">{{ profile.name }}</p>
    </div>

    <div v-if="profile.location">
      <p class="font-bold">Location:</p>
      <p class="italic" data-testid="profile-location">
        {{ profile.location }}
      </p>
    </div>

    <div v-if="profile.startedDiving">
      <p class="font-bold">Started diving:</p>
      <p class="italic" data-testid="profile-started-diving">
        {{ profile.startedDiving }}
      </p>
    </div>

    <div v-if="profile.experienceLevel">
      <p class="font-bold">Experience level:</p>
      <p class="italic" data-testid="profile-experience-level">
        {{ profile.experienceLevel }}
      </p>
    </div>

    <div v-if="profile.bio">
      <p class="font-bold">Bio:</p>
      <p class="italic" data-testid="profile-bio">{{ profile.bio }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ProfileDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';

import UserAvatar from './user-avatar.vue';

interface ViewProfileProps {
  profile: ProfileDTO;
}

defineProps<ViewProfileProps>();
</script>
