<template>
  <form @submit.prevent="">
    <fieldset class="flex flex-col gap-4" :disabled="isSaving">
      <div class="flex justify-between items-center">
        <UserAvatar :profile="teamMember.member" size="medium" show-name />
      </div>

      <FormField label="Position" control-id="team-member-title">
        <FormTextBox
          v-model.trim="state.title"
          control-id="team-member-title"
          test-id="team-member-title"
          placeholder="e.g. Dive Master, Instructor, etc."
          :maxlength="200"
        />
      </FormField>

      <FormField label="Joined" control-id="team-member-joined">
        <FormFuzzyDate v-model="state.joined" control-id="team-member-joined" />
      </FormField>

      <div class="flex gap-3 justify-center">
        <FormButton
          type="primary"
          submit
          :is-loading="isSaving"
          control-id="btn-team-member-save"
          testid="btn-team-member-save"
          @click="onSave"
        >
          Save Team Member
        </FormButton>
        <FormButton
          control-id="btn-team-member-cancel"
          test-id="btn-team-member-cancel"
          @click="$emit('cancel')"
        >
          Cancel
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { TeamMemberDTO } from '@bottomtime/api';

import { reactive, watch } from 'vue';

import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import FormFuzzyDate from '../../common/form-fuzzy-date.vue';
import FormTextBox from '../../common/form-text-box.vue';
import UserAvatar from '../../users/user-avatar.vue';

interface EditTeamMemberProps {
  isSaving?: boolean;
  teamMember: TeamMemberDTO;
}

interface EditTeamMemberState {
  title: string;
  joined: string;
}

function getStateFromDTO(teamMember: TeamMemberDTO): EditTeamMemberState {
  return {
    title: teamMember.title || '',
    joined: teamMember.joined || '',
  };
}

const props = withDefaults(defineProps<EditTeamMemberProps>(), {
  isSaving: false,
});
const state = reactive<EditTeamMemberState>(getStateFromDTO(props.teamMember));
const emit = defineEmits<{
  (e: 'save', teamMember: TeamMemberDTO): void;
  (e: 'cancel'): void;
}>();

function onSave() {
  emit('save', {
    member: props.teamMember.member,
    title: state.title || undefined,
    joined: state.joined || undefined,
  });
}

watch(
  () => props.teamMember,
  (value) => {
    Object.assign(state, getStateFromDTO(value));
  },
);
</script>
