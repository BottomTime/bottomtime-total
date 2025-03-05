<template>
  <div class="flex flex-col items-center gap-3">
    <p class="text-center">
      <span class="font-bold">
        Invite a dive buddy, instructor, or dive master to sign your log entry.
      </span>
      <span>
        Allow them to scan the QR Code below or share the link below it. You can
        copy the link by clicking on it.
      </span>
    </p>
    <canvas ref="qrCanvas"></canvas>
    <a
      class="no-style space-x-1 font-bold underline cursor-pointer shadow-lg shadow-grey-800/70 text-secondary-dark hover:text-secondary-hover"
      @click="onCopy"
    >
      <span>
        <i class="fa-solid fa-copy"></i>
      </span>
      <span> {{ signUrl }}</span>
    </a>
    <Transition name="fade">
      <p v-if="showCopied" class="text-sm w-fit px-2 bg-success rounded-full">
        Copied!
      </p>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

import QRCode from 'qrcode';
import { computed, onMounted, ref } from 'vue';

import { Config } from '../../../config';

interface RequestSignatureProps {
  entry: LogEntryDTO;
}

const props = defineProps<RequestSignatureProps>();
const qrCanvas = ref<HTMLCanvasElement | null>(null);
const showCopied = ref(false);

const signUrl = computed(() =>
  new URL(
    `/logbook/${props.entry.creator.username}/${props.entry.id}/sign`,
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

onMounted(async () => {
  try {
    await QRCode.toCanvas(qrCanvas.value, signUrl.value);
  } catch (err) {
    // TODO
  }
});
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
