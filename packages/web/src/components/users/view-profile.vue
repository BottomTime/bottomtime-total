<template>
  <div class="flex flex-col space-y-4">
    <div class="flex justify-center">
      <UserAvatar
        :avatar="profile.avatar ?? undefined"
        :display-name="profile.name || `@${profile.username}`"
        size="large"
      />
    </div>

    <div class="grid grid-cols-2">
      <div class="space-y-3">
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
      </div>

      <div class="space-y-3">
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
      </div>
    </div>

    <div v-if="profile.bio">
      <p class="font-bold">Bio:</p>
      <p class="italic" data-testid="profile-bio">{{ profile.bio }}</p>
    </div>

    <div class="flex justify-center space-x-3">
      <a v-if="showLogbookLink" :href="`/logbook/${profile.username}`">
        <FormButton class="space-x-2">
          <span>
            <i class="fa-solid fa-book-open"></i>
          </span>
          <span>View Log Book</span>
        </FormButton>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LogBookSharing, ProfileDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';
import { ref, watch } from 'vue';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import UserAvatar from './user-avatar.vue';

interface ViewProfileProps {
  profile: ProfileDTO;
}

const client = useClient();
const currentuser = useCurrentUser();
const oops = useOops();

const showLogbookLink = ref(false);

const props = defineProps<ViewProfileProps>();

watch(
  props.profile,
  async () => {
    const username = currentuser.user?.username;
    const friendUsername = props.profile.username;

    if (props.profile.logBookSharing === LogBookSharing.Public) {
      showLogbookLink.value = true;
    } else if (props.profile.logBookSharing === LogBookSharing.FriendsOnly) {
      showLogbookLink.value = false;
      if (!username) return;

      await oops(async () => {
        showLogbookLink.value = await client.friends.areFriends(
          username,
          friendUsername,
        );
      });
    } else {
      showLogbookLink.value = false;
    }
  },
  { immediate: true },
);
</script>
