<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div class="border-2 border-secondary p-2 rounded-md space-y-3">
      <TextHeading level="h3">Dive Info</TextHeading>
      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Entry time:</label>
        <span class="italic">
          {{
            dayjs(entry.timing.entryTime)
              .tz(entry.timing.timezone)
              .format('LLL')
          }}
        </span>
        <span class="italic">{{ entry.timing.timezone }}</span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Duration:</label>
        <span class="italic">
          {{ getFormattedDuration(entry.timing.duration) }}
        </span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Bottom time:</label>
        <span class="italic">
          {{
            entry.timing.bottomTime
              ? getFormattedDuration(entry.timing.bottomTime)
              : 'Unspecified'
          }}
        </span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Maximum depth:</label>
        <DepthText
          v-if="entry.depths?.maxDepth"
          class="italic"
          :depth="entry.depths.maxDepth"
          :unit="entry.depths.depthUnit"
        />
        <span v-else class="italic">Unspecified</span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Average depth:</label>
        <DepthText
          v-if="entry.depths?.averageDepth"
          class="italic"
          :depth="entry.depths.averageDepth"
          :unit="entry.depths.depthUnit"
        />
        <span v-else class="italic">Unspecified</span>
      </div>
    </div>

    <div
      v-if="entry.conditions"
      class="border-2 border-secondary p-2 rounded-md space-y-3"
    >
      <TextHeading level="h3">Conditions</TextHeading>

      <div v-if="entry.conditions.weather" class="flex flex-col gap-0.5">
        <label class="font-bold">Weather:</label>
        <span class="italic capitalize">{{ entry.conditions.weather }}</span>
      </div>

      <div
        v-if="
          entry.conditions.airTemperature ||
          entry.conditions.surfaceTemperature ||
          entry.conditions.bottomTemperature
        "
        class="flex flex-col gap-0.5"
      >
        <label class="font-bold">Temperature:</label>
        <div class="flex gap-5">
          <div
            v-if="entry.conditions.airTemperature"
            class="flex flex-col items-center px-2"
          >
            <span>Air Temp</span>
            <TemperatureText
              class="italic"
              :temperature="entry.conditions.airTemperature"
              :unit="entry.conditions.temperatureUnit"
            />
          </div>

          <div
            v-if="entry.conditions.surfaceTemperature"
            class="flex flex-col items-center px-2"
          >
            <span>Water Temp</span>
            <TemperatureText
              class="italic"
              :temperature="entry.conditions.surfaceTemperature"
              :unit="entry.conditions.temperatureUnit"
            />
          </div>

          <div
            v-if="entry.conditions.bottomTemperature"
            class="flex flex-col items-center px-2"
          >
            <span>Thermocline</span>
            <TemperatureText
              class="italic"
              :temperature="entry.conditions.bottomTemperature"
              :unit="entry.conditions.temperatureUnit"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Water Conditions:</label>
        <div class="flex gap-5">
          <div class="flex flex-col items-center px-2">
            <span>Current</span>
            <span class="italic">{{ current }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Visibility</span>
            <span class="italic">{{ visibility }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Chop</span>
            <span class="italic">{{ chop }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import DepthText from '../common/depth-text.vue';
import TemperatureText from '../common/temperature-text.vue';
import TextHeading from '../common/text-heading.vue';

interface ViewLogbookEntryProps {
  entry: LogEntryDTO;
  narrow?: boolean;
}

const props = withDefaults(defineProps<ViewLogbookEntryProps>(), {
  narrow: false,
});

function getFormattedDuration(duration: number): string {
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const secs = Math.ceil(duration % 60);
  return `${hours}:${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

const current = computed(() => {
  const value = Math.round(props.entry.conditions?.current ?? 0);

  if (value === 1) return 'None';
  if (value === 2) return 'Light';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'Strong';
  if (value === 5) return 'Extreme';

  return 'Unspecified';
});

const visibility = computed(() => {
  const value = Math.round(props.entry.conditions?.visibility ?? 0);

  if (value === 1) return 'Nil';
  if (value === 2) return 'Poor';
  if (value === 3) return 'Fair';
  if (value === 4) return 'Good';
  if (value === 5) return 'Excellent';

  return 'Unspecified';
});

const chop = computed(() => {
  const value = Math.round(props.entry.conditions?.chop ?? 0);

  if (value === 1) return 'Calm';
  if (value === 2) return 'Light';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'Heavy';
  if (value === 5) return 'Severe';

  return 'Unspecified';
});
</script>
