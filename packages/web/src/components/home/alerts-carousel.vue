<template>
  <div class="relative w-full h-64">
    <div class="relative overflow-hidden rounded-lg h-full bg-grey-50">
      <AlertsCarouselItem
        v-for="(alert, index) in alerts"
        :key="alert.id"
        :alert="alert"
        :relative-position="index - currentIndex"
      />
    </div>

    <button
      type="button"
      class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
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
      type="button"
      class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
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
      class="absolute bottom-3 flex items-center justify-center w-full text-grey-950 space-x-3"
    >
      <button
        v-for="(_, index) in alerts"
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
import { AlertDTO } from '@bottomtime/api';

import { onMounted, ref } from 'vue';

import { useClient } from '../../client';
import { useOops } from '../../oops';
import AlertsCarouselItem from './alerts-carousel-item.vue';

const client = useClient();
const oops = useOops();

const alerts = ref<AlertDTO[]>([]);
const currentIndex = ref(0);

onMounted(async () => {
  await oops(async () => {
    const result = await client.alerts.listAlerts({ showDismissed: false });
    alerts.value = result.alerts.map((a) => a.toJSON());
  });
});

function onPrevious() {
  currentIndex.value =
    (currentIndex.value - 1 + alerts.value.length) % alerts.value.length;
}

function onNext() {
  currentIndex.value = (currentIndex.value + 1) % alerts.value.length;
}
</script>
