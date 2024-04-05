<template>
  <div class="flex flex-col gap-5 items-center">
    <Cropper
      class="rounded-md w-full"
      :debounce="false"
      :src="image"
      :stencil-component="circle ? CircleStencil : RectangleStencil"
      :stencil-props="{
        aspectRatio: stencilAspectRatio,
        handlers: {},
        movable: false,
        resizable: false,
      }"
      :stencil-size="stencilSize"
      image-restriction="stencil"
      @change="onChange"
    />
    <div class="align-middle">
      <Preview
        v-if="data.image"
        :class="`w-[${targetWidth}px] h-[${
          targetWidth / stencilAspectRatio
        }px] rounded-${circle ? 'full' : 'md'}`"
        :width="targetWidth"
        :height="targetWidth / stencilAspectRatio"
        :image="data.image"
        :coordinates="data.coordinates"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import {
  CircleStencil,
  Coordinates,
  Cropper,
  CropperResult,
  Preview,
  RectangleStencil,
  Size,
} from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

interface ImageCropperProps {
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '3:4' | '9:16';
  circle?: boolean;
  image: string;
  stencilWidth?: number;
  targetWidth: number;
}

interface ImageCropperData {
  coordinates: Coordinates | null;
  image: CropperResult['image'] | null;
}

interface ImageChangeEvent {
  coordinates: Coordinates;
}

const props = withDefaults(defineProps<ImageCropperProps>(), {
  aspectRatio: '16:9',
  circle: false,
});
const emit = defineEmits<{
  (e: 'change'): void;
}>();

const data = reactive<ImageCropperData>({
  coordinates: null,
  image: null,
});

const stencilAspectRatio = computed(() => {
  if (props.circle) return 1;

  const [w, h] = props.aspectRatio.split(':').map(Number);
  return w / h;
});

const stencilSize = computed<Size | undefined>(() =>
  props.stencilWidth
    ? {
        width: props.stencilWidth,
        height: props.stencilWidth / stencilAspectRatio.value,
      }
    : undefined,
);

function onChange(result: CropperResult) {
  data.coordinates = result.coordinates;
  data.image = result.image;

  console.log(result);
  emit('change');
}
</script>
