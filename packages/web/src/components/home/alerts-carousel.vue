<template>
  <div v-if="alerts.results.alerts.length > 0" class="relative w-full h-64">
    <div
      class="relative overflow-hidden rounded-lg h-full bg-grey-50"
      data-testid="carousel-content"
    >
      <AlertsCarouselItem
        v-for="(alert, index) in alerts.results.alerts"
        :key="alert.id"
        :alert="alert"
        :relative-position="index - currentIndex"
      />
    </div>

    <button
      v-if="alerts.results.alerts.length > 1"
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
      v-if="alerts.results.alerts.length > 1"
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
      v-if="alerts.results.alerts.length > 1"
      class="absolute bottom-3 flex items-center justify-center w-full text-grey-950 space-x-3"
      data-testid="carousel-indicators"
    >
      <button
        v-for="(_, index) in alerts.results.alerts"
        :key="index"
        :class="
          index === currentIndex ? 'text-grey-950/80' : 'text-grey-950/40'
        "
        @click="() => (currentIndex = index)"
      >
        <span>
          <i class="fa-solid fa-circle fa-sm"></i>
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onServerPrefetch, ref } from 'vue';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useAlerts } from '../../store';
import AlertsCarouselItem from './alerts-carousel-item.vue';

interface AlertsCarouselProps {
  rotateInterval?: number;
}

const alerts = useAlerts();
const client = useClient();
const oops = useOops();

const props = withDefaults(defineProps<AlertsCarouselProps>(), {
  rotateInterval: 10000,
});

const currentIndex = ref(0);

function rotate() {
  onNext();
  setTimeout(rotate, props.rotateInterval);
}

onMounted(() => {
  setTimeout(rotate, props.rotateInterval);
});

onServerPrefetch(async () => {
  await oops(async () => {
    const result = await client.alerts.listAlerts({ showDismissed: false });
    alerts.results = {
      alerts: result.alerts.map((a) => a.toJSON()),
      totalCount: result.totalCount,
    };
  });
});

function onPrevious() {
  currentIndex.value =
    (currentIndex.value - 1 + alerts.results.alerts.length) %
    alerts.results.alerts.length;
}

function onNext() {
  currentIndex.value = (currentIndex.value + 1) % alerts.results.alerts.length;
}
</script>
