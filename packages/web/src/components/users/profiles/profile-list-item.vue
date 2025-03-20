<template>
  <li class="flex gap-3 my-2 items-center">
    <div v-if="multiSelect" class="my-3">
      <FormCheckbox
        :model-value="profile.selected"
        @update:model-value="onToggleSelected"
      >
        <span class="sr-only">Select {{ displayName }}</span>
      </FormCheckbox>
    </div>

    <figure>
      <UserAvatar :profile="profile" size="medium" />
    </figure>

    <article class="grow flex flex-col gap-1">
      <div class="flex items-baseline gap-2">
        <button
          class="text-2xl text-link hover:text-link-hover"
          @click="$emit('profile-selected', profile)"
        >
          {{ displayName }}
        </button>
        <p v-if="profile.name" class="text-sm">{{ `@${profile.username}` }}</p>
      </div>

      <div v-if="profile.bio" class="italic text-pretty">
        {{ profile.bio }}
      </div>

      <div class="flex gap-3 justify-evenly flex-wrap">
        <div class="text-center">
          <p class="font-bold">Joined</p>
          <p>{{ dayjs(profile.memberSince).fromNow() }}</p>
        </div>

        <div v-if="profile.location" class="text-center">
          <p class="font-bold">Location</p>
          <p class="text-wrap">{{ profile.location }}</p>
        </div>

        <div v-if="profile.experienceLevel" class="text-center">
          <p class="font-bold">Experience Level</p>
          <p>{{ profile.experienceLevel }}</p>
        </div>

        <div v-if="profile.startedDiving" class="text-center">
          <p class="font-bold">Started Diving</p>
          <p>{{ dayjs(profile.startedDiving).fromNow() }}</p>
        </div>
      </div>

      <div v-if="logbookShared">
        <a
          class="space-x-1"
          :href="`/logbook/${profile.username}`"
          target="_blank"
        >
          <span>View Logbook</span>
          <span>
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </span>
        </a>
      </div>
    </article>
  </li>
</template>

<script lang="ts" setup>
import { LogBookSharing, ProfileDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';
import { computed } from 'vue';

import { Selectable } from '../../../common';
import FormCheckbox from '../../common/form-checkbox.vue';
import UserAvatar from '../user-avatar.vue';

interface ProfileListItemProps {
  isFriend?: boolean;
  multiSelect?: boolean;
  profile: Selectable<ProfileDTO>;
}

const props = withDefaults(defineProps<ProfileListItemProps>(), {
  isFriend: false,
  multiSelect: false,
});
const emit = defineEmits<{
  (e: 'profile-selected', profile: ProfileDTO): void;
  (
    e: 'toggle-selected',
    profile: Selectable<ProfileDTO>,
    selected: boolean,
  ): void;
}>();

const displayName = computed(
  () => props.profile.name || `@${props.profile.username}`,
);

const logbookShared = computed(
  () =>
    props.profile.logBookSharing === LogBookSharing.Public ||
    (props.isFriend &&
      props.profile.logBookSharing === LogBookSharing.FriendsOnly),
);

function onToggleSelected() {
  emit('toggle-selected', props.profile, !props.profile.selected);
}
</script>
