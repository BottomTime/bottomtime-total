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
  validateFile?: (file: File) => boolean | string;
  uploadUrl: string;
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

const props = defineProps<FileUploadProps>();

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

/*
function uploadFile() {
  var file = _("file1").files[0];
  // alert(file.name+" | "+file.size+" | "+file.type);
  var formdata = new FormData();
  formdata.append("file1", file);
  var ajax = new XMLHttpRequest();
  ajax.upload.addEventListener("progress", progressHandler, false);
  ajax.addEventListener("load", completeHandler, false);
  ajax.addEventListener("error", errorHandler, false);
  ajax.addEventListener("abort", abortHandler, false);
  ajax.open("POST", "file_upload_parser.php"); // http://www.developphp.com/video/JavaScript/File-Upload-Progress-Bar-Meter-Tutorial-Ajax-PHP
  //use file_upload_parser.php from above url
  ajax.send(formdata);
}

function progressHandler(event) {
  _("loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
  var percent = (event.loaded / event.total) * 100;
  _("progressBar").value = Math.round(percent);
  _("status").innerHTML = Math.round(percent) + "% uploaded... please wait";
}

function completeHandler(event) {
  _("status").innerHTML = event.target.responseText;
  _("progressBar").value = 0; //wil clear progress bar after successful upload
}

function errorHandler(event) {
  _("status").innerHTML = "Upload Failed";
}

function abortHandler(event) {
  _("status").innerHTML = "Upload Aborted";
}
*/

function uploadFile(file: File, index: number): Promise<void> {
  return new Promise((done) => {
    const formdata = new FormData();
    formdata.append('file', file);

    const req = new XMLHttpRequest();
    req.upload.addEventListener('progress', (e) => {}, false);
    req.addEventListener('load', (e) => {}, false);
    req.addEventListener('error', (e) => {}, false);
    req.addEventListener('abort', (e) => {}, false);

    req.open('POST', props.uploadUrl);
    req.send(formdata);
  });
}

async function handleFiles(files: FileList): Promise<void> {
  data.uploads = [...files].map((file) => ({
    file: file.name,
    progress: 0,
    done: false,
    size: file.size,
  }));

  await Promise.all([...files].map(uploadFile));

  data.uploads = [];
}

async function onFilesDrop(e: DragEvent): Promise<void> {
  isDragging.value = false;
  if (e.dataTransfer?.files.length) {
    await handleFiles(e.dataTransfer.files);
  }
}

async function onFileUploadChange(e: Event): Promise<void> {
  if (e.target instanceof HTMLInputElement && e.target.files?.length) {
    await handleFiles(e.target.files);
  }
}
</script>
