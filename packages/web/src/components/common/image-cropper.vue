<template>
  <Cropper
    class="rounded-md"
    :canvas="{}"
    :src="image"
    :stencil-component="circle ? CircleStencil : RectangleStencil"
    :stencil-props="{
      aspectRatio: stencilAspectRatio,
      handlers: {},
      movable: false,
      resizable: false,
    }"
    :stencil-size="stencilSize"
    :resize-image="{ adjustStencil: false }"
    image-restriction="stencil"
    @change="onChange"
  />
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import {
  CircleStencil,
  Coordinates,
  Cropper,
  CropperResult,
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

const props = withDefaults(defineProps<ImageCropperProps>(), {
  aspectRatio: '16:9',
  circle: false,
});
const emit = defineEmits<{
  (e: 'change', coords: Coordinates): void;
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
  emit('change', result.coordinates);
}
</script>
