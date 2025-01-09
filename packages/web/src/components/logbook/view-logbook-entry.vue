<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <!-- General Dive Info -->
    <div class="border-2 border-secondary p-2 rounded-md space-y-3">
      <TextHeading level="h2">Dive Info</TextHeading>
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

    <!-- Dive Conditions -->
    <div
      v-if="entry.conditions"
      class="border-2 border-secondary p-2 rounded-md space-y-3"
    >
      <TextHeading level="h2">Conditions</TextHeading>

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

    <!-- Gas Consumption -->
    <div
      v-if="entry.air && entry.air.length"
      class="border-2 border-secondary p-2 rounded-md space-y-3"
    >
      <TextHeading level="h2">Breathing Gas</TextHeading>

      <div
        v-for="(tank, index) in entry.air"
        :key="index"
        class="flex align-baseline gap-3 ml-2"
      >
        <span class="font-bold font-mono text-lg">{{ index + 1 }})</span>
        <div>
          <p class="space-x-2">
            <span class="font-bold">{{ tank.name }}</span>
            <span v-if="tank.count > 1" class="rounded-full bg-link px-1 mx-1">
              x{{ tank.count }}
            </span>
          </p>
          <p class="space-x-2">
            <PressureText
              :pressure="tank.startPressure"
              :unit="tank.pressureUnit"
            />
            <span>
              <i class="fa-solid fa-arrow-right"></i>
            </span>
            <PressureText
              :pressure="tank.endPressure"
              :unit="tank.pressureUnit"
            />
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="entry.equipment"
      class="border-2 border-secondary p-2 rounded-md space-y-3"
    >
      <TextHeading level="h2">Equipment</TextHeading>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Weight:</label>
        <WeightText
          v-if="entry.equipment.weight"
          class="italic"
          :weight="entry.equipment.weight"
          :unit="entry.equipment.weightUnit"
        />
        <span v-else class="italic">Unspecified</span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Exposure Suit:</label>
        <span class="italic">{{ exposureSuit }}</span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Weight Configuration:</label>
        <div class="flex gap-5">
          <div class="flex flex-col items-center px-2">
            <span>Amount</span>
            <span class="italic">{{ weightCorrectness }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Trim</span>
            <span class="italic">{{ trim }}</span>
          </div>
        </div>
      </div>

      <p>{{ JSON.stringify(entry.equipment) }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ExposureSuit,
  LogEntryDTO,
  TrimCorrectness,
  WeightCorrectness,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import DepthText from '../common/depth-text.vue';
import PressureText from '../common/pressure-text.vue';
import TemperatureText from '../common/temperature-text.vue';
import TextHeading from '../common/text-heading.vue';
import WeightText from '../common/weight-text.vue';

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

const weightCorrectness = computed(() => {
  if (!props.entry.equipment?.weightCorrectness) return 'Unspecified';

  switch (props.entry.equipment.weightCorrectness) {
    case WeightCorrectness.Good:
      return 'Correct';
    case WeightCorrectness.Under:
      return 'Too light';
    case WeightCorrectness.Over:
      return 'Too heavy';
    default:
      return 'Unspecified';
  }
});

const trim = computed(() => {
  if (!props.entry.equipment?.trimCorrectness) return 'Unspecified';

  switch (props.entry.equipment.trimCorrectness) {
    case TrimCorrectness.Good:
      return 'Correct';
    case TrimCorrectness.HeadDown:
      return 'Head down';
    case TrimCorrectness.KneesDown:
      return 'Knees down';
    default:
      return 'Unspecified';
  }
});

const exposureSuit = computed(() => {
  if (!props.entry.equipment?.exposureSuit) return 'Unspecified';

  switch (props.entry.equipment.exposureSuit) {
    case ExposureSuit.Drysuit:
      return 'Drysuit';
    case ExposureSuit.None:
      return 'None';
    case ExposureSuit.Other:
      return 'Other';
    case ExposureSuit.Rashguard:
      return 'Rashguard';
    case ExposureSuit.Shorty:
      return 'Shorty';
    case ExposureSuit.Wetsuit3mm:
      return '3mm Wetsuit';
    case ExposureSuit.Wetsuit5mm:
      return '5mm Wetsuit';
    case ExposureSuit.Wetsuit7mm:
      return '7mm Wetsuit';
    case ExposureSuit.Wetsuit9mm:
      return '9mm Wetsuit';
    default:
      return props.entry.equipment.exposureSuit;
  }
});
</script>
