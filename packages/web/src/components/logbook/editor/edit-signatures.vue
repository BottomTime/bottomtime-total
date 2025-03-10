<template>
  <RequestSignaturesDialog
    :visible="state.showRequestSignatures"
    :log-entry="entry"
    @close="state.showRequestSignatures = false"
  />

  <ConfirmDialog
    title="Delete Signature?"
    confirm-text="Delete"
    dangerous
    :visible="state.showConfirmDeleteSignature"
    :is-loading="state.isDeleting"
    @confirm="onConfirmDeleteSignature"
    @cancel="onCancelDeleteSignature"
  >
    <p>
      <span>Are you sure you want to delete the signature from </span>
      <span class="font-bold">
        {{
          state.selectedSignature?.buddy.name ||
          `@${state.selectedSignature?.buddy.username}`
        }}
      </span>
      <span>?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700/40 to-blue-500/40 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Signatures</TextHeading>

    <LogEntrySignaturesList
      :signatures="state.signatures"
      edit-mode
      @delete="onDeleteSignature"
    />

    <div class="text-center">
      <FormButton @click="state.showRequestSignatures = true">
        Request signatures...
      </FormButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ApiList, LogEntryDTO, LogEntrySignatureDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormButton from '../../common/form-button.vue';
import TextHeading from '../../common/text-heading.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import RequestSignaturesDialog from '../../dialog/request-signatures-dialog.vue';
import LogEntrySignaturesList from '../log-entry-signatures-list.vue';

interface EditSignaturesProps {
  entry: LogEntryDTO;
}

interface EditSignaturesState {
  isDeleting: boolean;
  isLoading: boolean;
  selectedSignature?: LogEntrySignatureDTO;
  signatures: ApiList<LogEntrySignatureDTO>;
  showConfirmDeleteSignature: boolean;
  showRequestSignatures: boolean;
}

const client = useClient();
const oops = useOops();

const props = defineProps<EditSignaturesProps>();
const state = reactive<EditSignaturesState>({
  isDeleting: false,
  isLoading: true,
  signatures: {
    data: [],
    totalCount: 0,
  },
  showConfirmDeleteSignature: false,
  showRequestSignatures: false,
});

function onDeleteSignature(signature: LogEntrySignatureDTO) {
  state.selectedSignature = signature;
  state.showConfirmDeleteSignature = true;
}

function onCancelDeleteSignature() {
  state.showConfirmDeleteSignature = false;
  state.selectedSignature = undefined;
}

async function onConfirmDeleteSignature(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!state.selectedSignature) return;

    await client.logEntries.deleteLogEntrySignature(
      props.entry.creator.username,
      props.entry.id,
      state.selectedSignature.buddy.username,
    );

    const index = state.signatures.data.findIndex(
      (s) => s.id === state.selectedSignature?.id,
    );
    if (index > -1) {
      state.signatures.data.splice(index, 1);
      state.signatures.totalCount--;
    }

    state.showConfirmDeleteSignature = false;
    state.selectedSignature = undefined;
  });

  state.isDeleting = false;
}

onMounted(async () => {
  await oops(async () => {
    state.signatures = await client.logEntries.listLogEntrySignatures(
      props.entry.creator.username,
      props.entry.id,
    );
  });

  state.isLoading = false;
});
</script>
