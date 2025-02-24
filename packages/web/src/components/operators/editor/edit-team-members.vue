<template>
  <DrawerPanel
    title="Add Team Member"
    :visible="state.showSearchTeamMember"
    @close="onCancelAddTeamMember"
  >
    <div v-if="state.newTeamMember">
      <EditTeamMember
        :team-member="state.newTeamMember"
        @cancel="state.newTeamMember = undefined"
        @save="onConfirmAddTeamMembers"
      />
    </div>

    <SearchProfiles
      v-show="!state.newTeamMember"
      :is-saving="state.isAddingTeamMember"
      @select-profiles="onTeamMemberSelected"
    />
  </DrawerPanel>

  <DrawerPanel
    title="Edit Team Member"
    :visible="state.showEditTeamMember && !!state.selectedTeamMember"
    @close="onCancelEditTeamMember"
  >
    <EditTeamMember
      v-if="state.selectedTeamMember"
      :team-member="state.selectedTeamMember"
      :is-saving="state.isUpdating"
      @cancel="onCancelEditTeamMember"
      @save="onConfirmEditTeamMember"
    />
  </DrawerPanel>

  <ConfirmDialog
    :visible="state.showConfirmRemoveTeamMember && !!state.selectedTeamMember"
    title="Remove Team Member?"
    confirm-text="Remove Team Member"
    dangerous
    :is-loading="state.isRemoving"
    @cancel="onCancelRemoveTeamMember"
    @confirm="onConfirmRemoveTeamMember"
  >
    <p>
      <span>Are you sure you want to remove team member </span>
      <span class="font-bold">
        {{
          state.selectedTeamMember?.member.name ||
          state.selectedTeamMember?.member.username
        }}
      </span>
      <span>?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <FormBox>
    <div class="flex justify-between items-baseline">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ state.teamMembers.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.teamMembers.totalCount }}</span>
        <span> team members</span>
      </p>

      <div>
        <FormButton
          type="primary"
          size="sm"
          control-id="btn-add-team-member"
          test-id="btn-add-team-member"
          @click="onAddTeamMember"
        >
          <p class="space-x-1">
            <i class="fa-solid fa-plus"></i>
            <span>Add Team Member</span>
          </p>
        </FormButton>
      </div>
    </div>
  </FormBox>

  <LoadingSpinner
    v-if="state.isLoading"
    class="text-center text-lg my-8"
    message="Fetching team members..."
  />
  <TransitionList v-else class="px-2">
    <TeamMemberListItem
      v-for="teamMember in state.teamMembers.data"
      :key="teamMember.member.username"
      :team-member="teamMember"
      editable
      @select="onEditTeamMember"
      @edit="onEditTeamMember"
      @remove="onRemoveTeamMember"
    />
    <li v-if="!state.teamMembers.data.length" class="text-center my-8 text-lg">
      No one has been added to your team yet. 😢
    </li>
  </TransitionList>
</template>

<script setup lang="ts">
import {
  ApiList,
  OperatorDTO,
  ProfileDTO,
  TeamMemberDTO,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { ToastType } from '../../../common';
import { useOops } from '../../../oops';
import { useToasts } from '../../../store';
import DrawerPanel from '../../common/drawer-panel.vue';
import FormBox from '../../common/form-box.vue';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TransitionList from '../../common/transition-list.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import SearchProfiles from '../../users/profiles/search-profiles.vue';
import TeamMemberListItem from '../team-member-list-item.vue';
import EditTeamMember from './edit-team-member.vue';

interface EditTeamMembersProps {
  isSaving?: boolean;
  operator: OperatorDTO;
}

interface EditTeamMembersState {
  isAddingTeamMember: boolean;
  isLoading: boolean;
  isRemoving: boolean;
  isUpdating: boolean;
  newTeamMember?: TeamMemberDTO;
  selectedTeamMember?: TeamMemberDTO;
  showConfirmRemoveTeamMember: boolean;
  showEditTeamMember: boolean;
  showSearchTeamMember: boolean;
  teamMembers: ApiList<TeamMemberDTO>;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = withDefaults(defineProps<EditTeamMembersProps>(), {
  isSaving: false,
});
const state = reactive<EditTeamMembersState>({
  isAddingTeamMember: false,
  isLoading: true,
  isRemoving: false,
  isUpdating: false,
  showConfirmRemoveTeamMember: false,
  showEditTeamMember: false,
  showSearchTeamMember: false,
  teamMembers: {
    data: [],
    totalCount: 0,
  },
});

function onAddTeamMember() {
  state.newTeamMember = undefined;
  state.showSearchTeamMember = true;
}

function onCancelAddTeamMember() {
  state.showSearchTeamMember = false;
}

function onTeamMemberSelected(profiles: ProfileDTO | ProfileDTO[]) {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  state.newTeamMember = {
    member: profile,
    title: undefined,
    joined: undefined,
  };
}

function onRemoveTeamMember(teamMember: TeamMemberDTO) {
  state.selectedTeamMember = teamMember;
  state.showConfirmRemoveTeamMember = true;
}

function onCancelRemoveTeamMember() {
  state.showConfirmRemoveTeamMember = false;
  state.selectedTeamMember = undefined;
}

async function onConfirmRemoveTeamMember(): Promise<void> {
  state.isRemoving = true;
  await oops(async () => {
    if (!state.selectedTeamMember) return;
    await client.operators.removeTeamMembers(
      props.operator.slug,
      state.selectedTeamMember.member.username,
    );

    const index = state.teamMembers.data.findIndex(
      (tm) => tm.member.userId === state.selectedTeamMember?.member.userId,
    );

    if (index > -1) {
      state.teamMembers.data.splice(index, 1);
      state.teamMembers.totalCount--;

      toasts.toast({
        id: 'team-member-removed',
        message: 'Team member removed successfully',
        type: ToastType.Success,
      });
    }

    state.showConfirmRemoveTeamMember = false;
    state.selectedTeamMember = undefined;
  });

  state.isRemoving = false;
}

async function onConfirmAddTeamMembers(
  teamMember: TeamMemberDTO,
): Promise<void> {
  state.isAddingTeamMember = true;

  await oops(async () => {
    await client.operators.addOrUpdateTeamMember(
      props.operator.slug,
      teamMember.member.username,
      teamMember,
    );

    state.teamMembers.data.splice(0, 0, teamMember);
    state.teamMembers.totalCount++;

    toasts.toast({
      id: 'team-member-added',
      message: 'Team member added successfully',
      type: ToastType.Success,
    });

    state.showSearchTeamMember = false;
  });

  state.isAddingTeamMember = false;
}

function onEditTeamMember(teamMember: TeamMemberDTO) {
  state.selectedTeamMember = teamMember;
  state.showEditTeamMember = true;
}

function onCancelEditTeamMember() {
  state.showEditTeamMember = false;
  state.selectedTeamMember = undefined;
}

async function onConfirmEditTeamMember(
  teamMember: TeamMemberDTO,
): Promise<void> {
  state.isUpdating = true;

  await oops(async () => {
    await client.operators.addOrUpdateTeamMember(
      props.operator.slug,
      teamMember.member.username,
      teamMember,
    );

    const index = state.teamMembers.data.findIndex(
      (tm) => tm.member.userId === teamMember.member.userId,
    );
    if (index > -1) {
      state.teamMembers.data.splice(index, 1, teamMember);
    }

    toasts.toast({
      id: 'team-member-updated',
      message: 'Team member saved successfully',
      type: ToastType.Success,
    });

    state.selectedTeamMember = undefined;
    state.showEditTeamMember = false;
  });

  state.isUpdating = false;
}

onMounted(async () => {
  await oops(async () => {
    state.teamMembers = await client.operators.listTeamMembers(
      props.operator.slug,
    );
  });

  state.isLoading = false;
});
</script>
