<template>
  <div class="w-full flex flex-col space-y-3">
    <div
      :class="`w-full h-[200px] border-2 border-${
        showDragAndDropHighlight ? 'success' : 'secondary'
      } rounded-lg flex`"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onFilesDrop"
      @dragover.prevent="onDragEnter"
    >
      <div
        :class="`m-auto text-center text-xl text-${
          showDragAndDropHighlight ? 'success' : 'secondary'
        } space-x-3`"
      >
        <span>
          <i class="fa-regular fa-file-image"></i>
        </span>
        <span>Drag your image here.</span>
      </div>
    </div>

    <div class="text-center">
      <input
        type="file"
        class="text-grey-300 text-sm file:text-black file:p-2 file:mx-3 file:border-1 file:border-grey-800 file:shadow-sm file:shadow-grey-800 file:rounded-md file:bg-secondary file:hover:bg-secondary-hover"
        :accept="accept"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface FileUploadProps {
  accept?: string;
  validateFile?: (file: File) => boolean | string;
}

interface FileUploadProgress {
  file: string;
  progress: number;
}

defineProps<FileUploadProps>();

const showDragAndDropHighlight = ref(false);

function onDragEnter() {
  showDragAndDropHighlight.value = true;
}

function onDragLeave() {
  showDragAndDropHighlight.value = false;
}

async function uploadFile(file: File) {
  const stream = file.stream();

  let done = false;
  do {
    const result = await stream.getReader().read();
    done = result.done;
  } while (!done);
}

async function onFilesDrop(e: DragEvent) {
  showDragAndDropHighlight.value = false;
  if (e.dataTransfer?.files.length) {
    for (const file of e.dataTransfer.files) {
      await uploadFile(file);
    }
  }
}
</script>
