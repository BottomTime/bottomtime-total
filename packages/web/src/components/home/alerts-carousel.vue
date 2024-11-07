<template>
  <div v-if="state.results.data.length > 0" class="relative w-full h-64">
    <div
      class="relative overflow-hidden rounded-lg h-full bg-grey-50"
      data-testid="carousel-content"
    >
      <AlertsCarouselItem
        v-for="(alert, index) in state.results.data"
        :key="alert.id"
        :alert="alert"
        :relative-position="index - state.currentIndex"
      />
    </div>

    <button
      v-if="state.results.data.length > 1"
      type="button"
      class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      data-testid="carousel-prev"
      @click="onPrevious"
    >
      <span
        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-grey-400/80 group-hover:bg-grey-400/40 group-focus:ring-2 group-focus:ring-white group-focus:outline-none text-grey-950"
      >
        <i class="fa-solid fa-chevron-left"></i>
        <span class="sr-only">Previous</span>
      </span>
    </button>

    <button
      v-if="state.results.data.length > 1"
      type="button"
      class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      data-testid="carousel-next"
      @click="onNext"
    >
      <span
        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-grey-400/80 group-hover:bg-grey-400/40 group-focus:ring-2 group-focus:ring-white group-focus:outline-none text-grey-950"
      >
        <i class="fa-solid fa-chevron-right"></i>
        <span class="sr-only">Next</span>
      </span>
    </button>

    <div
      v-if="state.results.data.length > 1"
      class="absolute bottom-3 flex items-center justify-center w-full text-grey-950 space-x-3"
      data-testid="carousel-indicators"
    >
      <button
        v-for="(_, index) in state.results.data"
        :key="index"
        :class="
          index === state.currentIndex ? 'text-grey-950/80' : 'text-grey-950/40'
        "
        @click="() => (state.currentIndex = index)"
      >
        <span>
          <i class="fa-solid fa-circle fa-sm"></i>
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO, ApiList } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import AlertsCarouselItem from './alerts-carousel-item.vue';

interface AlertsCarouselProps {
  rotateInterval?: number;
}

interface AlertsCarouselState {
  currentIndex: number;
  results: ApiList<AlertDTO>;
}

const client = useClient();
const oops = useOops();

const props = withDefaults(defineProps<AlertsCarouselProps>(), {
  rotateInterval: 10000,
});
const state = reactive<AlertsCarouselState>({
  currentIndex: 0,
  results: {
    data: [],
    totalCount: 0,
  },
});

function rotate() {
  onNext();
  setTimeout(rotate, props.rotateInterval);
}

onMounted(async () => {
  await oops(async () => {
    const result = await client.alerts.listAlerts({ showDismissed: false });
    state.results = {
      data: result.data.map((a) => a.toJSON()),
      totalCount: result.totalCount,
    };
  });
  setTimeout(rotate, props.rotateInterval);
});

function onPrevious() {
  state.currentIndex =
    (state.currentIndex - 1 + state.results.data.length) %
    state.results.data.length;
}

function onNext() {
  state.currentIndex = (state.currentIndex + 1) % state.results.data.length;
}
</script>
