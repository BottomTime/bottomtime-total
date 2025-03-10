<template>
  <PageTitle title="Sign Log Entry" />
  <BreadCrumbs :items="breadcrumbItems" />

  <RequireAuth2>
    <div v-if="state.isLoading" class="text-center text-lg my-4">
      <LoadingSpinner message="Fetching log entry..." />
    </div>

    <NotFound v-else-if="!state.logEntry" />

    <div
      v-else-if="currentUser.user?.username === route.params.username"
      class="text-center text-xl space-x-3 my-4"
      data-testid="no-self-sign-msg"
    >
      <span>
        <i class="fa-solid fa-hand"></i>
      </span>
      <span>Sorry, but you can't sign your own entry!</span>
    </div>

    <div v-else class="flex flex-col gap-3 items-center">
      <PreviewLogEntry :entry="state.logEntry" />
      <SignEntry
        class="w-fit"
        :entry="state.logEntry"
        @signed="onEntrySigned"
      />
    </div>
  </RequireAuth2>
</template>

<script lang="ts" setup>
import {
  AgencyDTO,
  LogEntryDTO,
  ProfessionalAssociationDTO,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth2 from '../../components/common/require-auth2.vue';
import PreviewLogEntry from '../../components/logbook/preview-log-entry.vue';
import SignEntry from '../../components/logbook/sign-entry.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface SignLogEntryViewState {
  agencies: AgencyDTO[];
  isLoading: boolean;
  logEntry: LogEntryDTO | null;
  professionalAssociations: ProfessionalAssociationDTO[];
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();

const state = reactive<SignLogEntryViewState>({
  agencies: [],
  isLoading: true,
  logEntry: null,
  professionalAssociations: [],
});

const breadcrumbItems = computed<Breadcrumb[]>(() => [
  {
    label: 'Logbook',
    to: `/logbook/${route.params.username}`,
  },
  ...(state.logEntry
    ? [
        {
          label: dayjs(state.logEntry.timing.entryTime).format('LLL'),
          to: `/logbook/${route.params.username}/${route.params.entryId}`,
        },
        {
          label: 'Sign',
          active: true,
        },
      ]
    : [
        {
          label: state.isLoading ? 'Loading...' : 'Entry Not Found',
          active: true,
        },
      ]),
]);

function onEntrySigned() {
  setTimeout(async () => {
    await router.push(
      `/logbook/${route.params.username}/${route.params.entryId}`,
    );
  }, 3000);
}

onMounted(async () => {
  await oops(
    async () => {
      state.logEntry = await client.logEntries.getLogEntry(
        route.params.username as string,
        route.params.entryId as string,
      );
    },
    {
      [404]: () => {
        state.logEntry = null;
      },
    },
  );

  await oops(async () => {
    if (!currentUser.user) return;

    const [associations, agencies] = await Promise.all([
      client.certifications.listProfessionalAssociations(
        currentUser.user.username,
      ),
      client.certifications.listAgencies(),
    ]);

    state.professionalAssociations = associations.data;
    state.agencies = agencies.data;
  });

  state.isLoading = false;
});
</script>
