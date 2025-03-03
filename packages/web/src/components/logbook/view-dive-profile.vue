<template>
  <div class="w-full aspect-video text-center">
    <LoadingSpinner
      v-if="state.isLoading"
      class="my-4 text-lg"
      message="Loading dive profile data..."
    />

    <div v-else class="space-y-4">
      <div
        class="w-full p-2 to-blue-900 from-blue-600 bg-gradient-to-b rounded-md shadow-md shadow-grey-700"
      >
        <LineChart
          class="w-[640px] aspect-video mx-auto"
          :chart-data="chartData"
          :options="chartOptions"
        />
      </div>

      <div
        class="w-full p-2 to-blue-900 from-blue-600 bg-gradient-to-b rounded-md shadow-md shadow-grey-700"
      >
        <GoogleMap
          :center="mapCenter"
          :marker="startingPosition"
          :zoom="16"
          :dive-path="divePath"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  DepthUnit,
  GpsCoordinates,
  LogEntryDTO,
  LogEntrySampleDTO,
} from '@bottomtime/api';

import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { computed, onMounted, reactive } from 'vue';
import { LineChart } from 'vue-chart-3';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import GoogleMap from '../common/google-map.vue';
import LoadingSpinner from '../common/loading-spinner.vue';

Chart.register(...registerables);

const client = useClient();
const oops = useOops();

interface ViewDiveProfileProps {
  entry: LogEntryDTO;
}

interface ViewDiveProfileState {
  isLoading: boolean;
  samples?: LogEntrySampleDTO[];
}

function formatMilliseconds(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours.toString().padStart(2, '0')}:${(minutes % 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

const props = defineProps<ViewDiveProfileProps>();
const state = reactive<ViewDiveProfileState>({
  isLoading: true,
});

const chartData = computed<ChartData<'line', number[]>>(() => ({
  xLabels:
    state.samples?.map((sample) => formatMilliseconds(sample.offset)) ?? [],
  datasets: [
    {
      label: 'Depth',
      data: state.samples?.map((sample) => sample.depth) ?? [],
      type: 'line',
    },
  ],
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  animations: {
    tension: {
      duration: 1000,
      easing: 'linear',
      from: 1,
      to: 0,
      loop: true,
    },
  },
  aspectRatio: 16 / 9,
  backgroundColor: 'white',
  color: 'black',
  datasets: {
    line: {},
  },
  responsive: true,
  plugins: {
    colors: {},
    decimation: {
      enabled: true,
      algorithm: 'lttb',
    },
    title: {
      color: 'black',
      text: 'Dive Profile',
      display: true,
      fullSize: true,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time',
        color: 'black',
      },
      ticks: {
        color: 'black',
      },
    },
    y: {
      title: {
        display: true,
        text: `Depth (${props.entry.depths?.depthUnit ?? DepthUnit.Meters})`,
        color: 'black',
      },
      reverse: true,
      ticks: {
        color: 'black',
        callback(tickValue: string | number) {
          return typeof tickValue === 'string'
            ? tickValue
            : `${tickValue.toFixed(1)}`;
        },
      },
    },
  },
}));

const mapCenter = computed<GpsCoordinates | undefined>(() => {
  let sampleCount = 0;
  const gps: GpsCoordinates | undefined = state.samples?.reduce(
    (acc, position) => {
      if (position.gps) {
        sampleCount++;
        acc.lat += position.gps.lat;
        acc.lon += position.gps.lng;
      }

      return acc;
    },
    { lat: 0, lon: 0 },
  );

  if (gps) {
    gps.lat /= sampleCount;
    gps.lon /= sampleCount;
  }

  return gps;
});

const divePath = computed<GpsCoordinates[] | undefined>(() => {
  let path = state.samples
    ?.filter((sample) => !!sample.gps)
    .map((sample) => ({ lat: sample.gps!.lat, lon: sample.gps!.lng }));

  if (path && path.length === 0) path = undefined;

  return path;
});

const startingPosition = computed<GpsCoordinates | undefined>(
  () => divePath.value?.[0],
);

onMounted(async () => {
  await oops(async () => {
    state.samples = await client.logEntries.loadLogEntrySampleData(
      props.entry.creator.username,
      props.entry.id,
    );
  });

  state.isLoading = false;
});
</script>
