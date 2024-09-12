<template>
  <ul v-if="data.uploads.length">
    <li
      v-for="upload in data.uploads"
      :key="upload.file"
      class="flex flex-col space-y-3 mx-3"
    >
      <div class="flex justify-between">
        <span class="text-lg font-bold">{{ upload.file }}</span>
        <span>{{ upload.size }}b</span>
      </div>

      <div class="flex space-x-3 items-baseline">
        <div class="grow rounded-full bg-grey-700 h-2.5 w-full">
          <div
            class="bg-secondary rounded-full h-full"
            :style="{ width: `${upload.progress}%` }"
          ></div>
        </div>

        <span>{{ upload.progress }}%</span>
      </div>
    </li>
  </ul>
  <div v-else class="w-full flex flex-col space-y-3">
    <div
      :class="borderClasses"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onFilesDrop"
    >
      <div :class="captionClasses">
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
        :multiple="multiple"
        :data-testid="testId"
        @change="onFileUploadChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  testId?: string;
  validateFile?: (file: File) => boolean | string;
}

interface ActiveUpload {
  file: string;
  progress: number;
  done: boolean;
  size: number;
}

interface FileUploadData {
  uploads: ActiveUpload[];
}

const emit = defineEmits<{
  (e: 'change', files: FileList): void;
}>();
defineProps<FileUploadProps>();

const isDragging = ref(false);
const borderClasses = computed(() => ({
  'border-2': true,
  'border-secondary': !isDragging.value,
  'border-success': isDragging.value,
  flex: true,
  'w-full': true,
  'h-[200px]': true,
  'rounded-lg': true,
}));
const captionClasses = computed(() => ({
  'text-secondary': !isDragging.value,
  'text-success': isDragging.value,
  'text-center': true,
  'text-xl': true,
  'm-auto': true,
  'space-x-3': true,
}));

const data = reactive<FileUploadData>({
  uploads: [],
});

function onDragEnter() {
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

async function onFilesDrop(e: DragEvent): Promise<void> {
  isDragging.value = false;
  if (e.dataTransfer?.files.length) {
    emit('change', e.dataTransfer.files);
  }
}

async function onFileUploadChange(e: Event): Promise<void> {
  if (e.target instanceof HTMLInputElement && e.target.files?.length) {
    emit('change', e.target.files);
  }
}
</script>
