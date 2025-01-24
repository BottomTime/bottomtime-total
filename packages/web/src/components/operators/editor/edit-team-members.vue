<template>
  <FormBox>
    <p>
      <span>Showing </span>
      <span class="font-bold">{{ state.teamMembers.data.length }}</span>
      <span> of </span>
      <span class="font-bold">{{ state.teamMembers.totalCount }}</span>
      <span> team members</span>
    </p>
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
    />
    <li v-if="!state.teamMembers.data.length" class="text-center my-8 text-lg">
      No one has been added to your team yet. 😢
    </li>
  </TransitionList>
</template>

<script setup lang="ts">
import { ApiList, OperatorDTO, TeamMemberDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormBox from '../../common/form-box.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TransitionList from '../../common/transition-list.vue';
import TeamMemberListItem from '../team-member-list-item.vue';

interface EditTeamMembersProps {
  isSaving?: boolean;
  operator: OperatorDTO;
}

interface EditTeamMembersState {
  isLoading: boolean;
  teamMembers: ApiList<TeamMemberDTO>;
}

const client = useClient();
const oops = useOops();

const props = withDefaults(defineProps<EditTeamMembersProps>(), {
  isSaving: false,
});
const state = reactive<EditTeamMembersState>({
  isLoading: true,
  teamMembers: {
    data: [],
    totalCount: 0,
  },
});

onMounted(async () => {
  await oops(async () => {
    state.teamMembers = await client.operators.listTeamMembers(
      props.operator.slug,
    );
  });

  state.isLoading = false;
});
</script>
