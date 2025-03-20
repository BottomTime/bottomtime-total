<template>
  <DialogBase
    title="Request Signatures"
    :visible="visible"
    @close="$emit('close')"
  >
    <template #default>
      <div class="flex flex-col items-center gap-3">
        <p class="text-center">
          <span class="font-bold">
            Invite a dive buddy, instructor, or dive master to sign your log
            entry.
          </span>
          <span>
            Allow them to scan the QR Code below or share the link below it. You
            can copy the link by clicking on it.
          </span>
        </p>
        <canvas ref="qrCanvas"></canvas>
        <a
          class="no-style space-x-1 font-bold underline cursor-pointer text-center shadow-lg shadow-grey-800/70 text-secondary-dark hover:text-secondary-hover"
          data-testid="lnk-copy-signature-url"
          @click="onCopy"
        >
          <span>
            <i class="fa-solid fa-copy"></i>
          </span>
          <span> {{ signUrl }}</span>
        </a>
        <Transition name="fade">
          <p
            v-if="showCopied"
            class="text-sm w-fit px-2 bg-success rounded-full"
          >
            Copied!
          </p>
        </Transition>
      </div>
    </template>
    <template #buttons>
      <FormButton
        test-id="btn-close-request-signatures"
        type="primary"
        @click="$emit('close')"
      >
        Close
      </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { LogEntryDTO } from '@bottomtime/api';

import QRCode from 'qrcode';
import { useLogger } from 'src/logger';
import { computed, nextTick, ref, watch } from 'vue';

import { Config } from '../../config';
import FormButton from '../common/form-button.vue';
import DialogBase from './dialog-base.vue';

interface RequestSignaturesDialogProps {
  logEntry: LogEntryDTO;
  visible?: boolean;
}

const log = useLogger('RequestSignaturesDialog');

const props = withDefaults(defineProps<RequestSignaturesDialogProps>(), {
  visible: false,
});
defineEmits<{
  (e: 'close'): void;
}>();

const qrCanvas = ref<HTMLCanvasElement | null>(null);
const showCopied = ref(false);
const signUrl = computed(() =>
  new URL(
    `/logbook/${props.logEntry.creator.username}/${props.logEntry.id}/sign`,
    Config.baseUrl,
  ).toString(),
);

async function onCopy(): Promise<void> {
  await navigator.clipboard.writeText(signUrl.value);
  showCopied.value = true;
  setTimeout(() => {
    showCopied.value = false;
  }, 3000);
}

watch(
  () => props.visible,
  async (visible): Promise<void> => {
    try {
      if (!visible) return;
      await nextTick();
      await QRCode.toCanvas(qrCanvas.value, signUrl.value);
    } catch (err) {
      log.warn('Failed to render QR code.', err);
    }
  },
  { immediate: true },
);
</script>

<style lang="css" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
