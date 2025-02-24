<template>
  <li class="flex gap-3 items-center my-2">
    <figure>
      <UserAvatar :profile="teamMember.member" size="medium" />
    </figure>

    <article class="grow flex flex-col gap-2">
      <div>
        <div class="flex flex-wrap gap-2 items-baseline">
          <button
            class="text-2xl font-bold text-link hover:text-link-hover"
            @click="$emit('select', teamMember)"
          >
            {{ displayName }}
          </button>

          <p v-if="teamMember.member.name">@{{ teamMember.member.username }}</p>
        </div>

        <div class="flex flex-wrap gap-4 items-baseline">
          <p v-if="teamMember.title" class="text-2xl">
            {{ teamMember.title }}
          </p>

          <p v-if="teamMember.joined">
            Since {{ dayjs(teamMember.joined).fromNow() }}
          </p>
        </div>
      </div>

      <div v-if="teamMember.member.bio" class="italic text-justify">
        {{ teamMember.member.bio }}
      </div>

      <div class="flex gap-12 justify-evenly">
        <div v-if="teamMember.member.location" class="text-center">
          <p class="font-bold">Experience Level</p>
          <p>{{ teamMember.member.experienceLevel }}</p>
        </div>

        <div v-if="teamMember.member.startedDiving" class="text-center">
          <p class="font-bold">Started Diving</p>
          <p>{{ dayjs(teamMember.member.startedDiving).fromNow() }}</p>
        </div>
      </div>
    </article>

    <div v-if="editable" class="min-w-24 text-right">
      <FormButton
        :test-id="`btn-edit-team-member-${teamMember.member.username}`"
        rounded="left"
        @click="$emit('edit', teamMember)"
      >
        <span>
          <i class="fa-solid fa-pencil"></i>
        </span>
        <span class="sr-only">Edit team member: {{ displayName }}</span>
      </FormButton>
      <FormButton
        type="danger"
        rounded="right"
        @click="$emit('remove', teamMember)"
      >
        <span>
          <i class="fa-solid fa-trash"></i>
        </span>
        <span class="sr-only">Remove team member: {{ displayName }}</span>
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { TeamMemberDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface TeamMemberListItemProps {
  editable?: boolean;
  teamMember: TeamMemberDTO;
}

const props = withDefaults(defineProps<TeamMemberListItemProps>(), {
  editable: false,
});
defineEmits<{
  (e: 'edit', teamMember: TeamMemberDTO): void;
  (e: 'remove', teamMember: TeamMemberDTO): void;
  (e: 'select', teamMember: TeamMemberDTO): void;
}>();

const displayName = computed(
  () => props.teamMember.member.name || `@${props.teamMember.member.username}`,
);
</script>
