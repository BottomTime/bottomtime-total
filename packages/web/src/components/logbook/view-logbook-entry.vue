<template>
  <div class="flex gap-5 justify-between items-center my-2">
    <div>
      <TextHeading v-if="entry.logNumber" level="h1">
        #{{ entry.logNumber }}
      </TextHeading>
    </div>
    <UserAvatar :profile="entry.creator" show-name />
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <!-- General Dive Info -->
    <div class="border-2 border-secondary p-2 rounded-md space-y-3 px-6">
      <TextHeading class="-ml-3" level="h2">Dive Info</TextHeading>
      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Timing:</label>
        <div class="flex gap-5">
          <div class="flex flex-col items-center px-2">
            <span>Entry Time</span>
            <span class="font-mono text-xs">
              {{
                dayjs(entry.timing.entryTime)
                  .tz(entry.timing.timezone)
                  .format('LLL')
              }}
            </span>
            <span class="font-mono text-xs">{{ entry.timing.timezone }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Duration</span>
            <span class="font-mono text-xs">
              {{ getFormattedDuration(entry.timing.duration) }}
            </span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Bottom Time</span>
            <span class="font-mono text-xs">
              {{ getFormattedDuration(entry.timing.bottomTime) }}
            </span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Surface Interval</span>
            <span class="font-mono text-xs">
              <!-- {{ getFormattedDuration(entry.timing.surfaceInterval) }} -->
              TODO
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Depth:</label>
        <div class="flex gap-5">
          <div class="flex flex-col items-center px-2">
            <span>Maximum</span>
            <DepthText
              v-if="entry.depths?.maxDepth"
              class="font-mono text-xs"
              :depth="entry.depths.maxDepth"
              :unit="entry.depths.depthUnit"
            />
            <span v-else class="font-mono text-xs">Unspecified</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Average</span>
            <DepthText
              v-if="entry.depths?.averageDepth"
              class="font-mono text-xs"
              :depth="entry.depths.averageDepth"
              :unit="entry.depths.depthUnit"
            />
            <span v-else class="font-mono text-xs">Unspecified</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Location -->
    <div class="border-2 border-secondary p-2 rounded-md space-y-3 px-6">
      <TextHeading class="-ml-3" level="h2">Location</TextHeading>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Dive Site:</label>
        <span class="font-mono text-xs capitalize">
          {{ entry.site?.name || 'Unspecified' }}
        </span>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Location:</label>
        <p class="font-mono text-xs capitalize">
          {{ entry.site?.location || 'Unspecified' }}
        </p>
        <p
          v-if="entry.site?.gps"
          class="font-mono text-xs flex gap-2 items-center"
        >
          <span class="text-danger">
            <i class="fa-solid fa-location-dot"></i>
          </span>
          <span>
            {{ entry.site.gps.lat }}
            {{ entry.site.gps.lat > 0 ? 'N' : 'S' }},
            {{ entry.site.gps.lon }}
            {{ entry.site.gps.lon > 0 ? 'E' : 'W' }}
          </span>
        </p>
      </div>
    </div>

    <!-- Dive Conditions -->
    <div
      v-if="entry.conditions"
      class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
    >
      <TextHeading class="-ml-3" level="h2">Conditions</TextHeading>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Weather:</label>
        <span class="font-mono text-xs capitalize">
          {{ entry.conditions.weather || 'Unspecified' }}
        </span>
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
          <div class="flex flex-col items-center px-2">
            <span>Air Temp</span>
            <TemperatureText
              v-if="entry.conditions.airTemperature"
              class="font-mono text-xs"
              :temperature="entry.conditions.airTemperature"
              :unit="entry.conditions.temperatureUnit"
            />
            <span v-else class="font-mono text-xs">Unspecified</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Water Temp</span>
            <TemperatureText
              v-if="entry.conditions.surfaceTemperature"
              class="font-mono text-xs"
              :temperature="entry.conditions.surfaceTemperature"
              :unit="entry.conditions.temperatureUnit"
            />
            <span v-else class="font-mono text-xs">Unspecified</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Thermocline</span>
            <TemperatureText
              v-if="entry.conditions.bottomTemperature"
              class="font-mono text-xs"
              :temperature="entry.conditions.bottomTemperature"
              :unit="entry.conditions.temperatureUnit"
            />
            <span v-else class="font-mono text-xs">Unspecified</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Water Conditions:</label>
        <div class="flex gap-5">
          <div class="flex flex-col items-center px-2">
            <span>Current</span>
            <span class="font-mono text-xs">{{ current }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Visibility</span>
            <span class="font-mono text-xs">{{ visibility }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Chop</span>
            <span class="font-mono text-xs">{{ chop }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Gas Consumption -->
    <div
      v-if="entry.air && entry.air.length"
      class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
    >
      <TextHeading class="-ml-3" level="h2">Breathing Gas</TextHeading>

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

    <!-- Equipment -->
    <div
      v-if="entry.equipment"
      class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
    >
      <TextHeading class="-ml-3" level="h2">Equipment</TextHeading>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Weight Configuration:</label>
        <div class="flex gap-5">
          <div class="flex flex-col items-center px-2">
            <span>Weight</span>
            <WeightText
              v-if="entry.equipment.weight"
              class="font-mono text-xs"
              :weight="entry.equipment.weight"
              :unit="entry.equipment.weightUnit"
            />
            <span v-else class="font-mono text-xs">Unspecified</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Correctness</span>
            <span class="font-mono text-xs">{{ weightCorrectness }}</span>
          </div>

          <div class="flex flex-col items-center px-2">
            <span>Trim</span>
            <span class="font-mono text-xs">{{ trim }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-0.5">
        <label class="font-bold">Exposure Suit:</label>
        <span class="font-mono text-xs">{{ exposureSuit }}</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <EquipmentIndicator label="Boots" :value="entry.equipment.boots" />
        <EquipmentIndicator label="Camera" :value="entry.equipment.camera" />
        <EquipmentIndicator label="Gloves" :value="entry.equipment.gloves" />
        <EquipmentIndicator label="Hood" :value="entry.equipment.hood" />
        <EquipmentIndicator label="Scooter" :value="entry.equipment.scooter" />
        <EquipmentIndicator label="Torch" :value="entry.equipment.torch" />
      </div>
    </div>

    <!-- Notes -->
    <div class="border-2 border-secondary p-2 rounded-md px-6">
      <div class="flex flex-col gap-0.5">
        <TextHeading class="-ml-3" level="h2">Notes</TextHeading>
        <label class="font-bold">Comments:</label>
        <p v-if="entry.notes" class="font-mono text-xs">{{ entry.notes }}</p>

        <label class="font-bold">Rating:</label>
        <p class="flex gap-2 items-center">
          <StarRating :rating="entry.rating" read-only />
          <span class="font-mono text-xs">
            {{ entry.rating?.toFixed(1) ?? 'not rated' }}
          </span>
        </p>
      </div>
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
import StarRating from '../common/star-rating.vue';
import TemperatureText from '../common/temperature-text.vue';
import TextHeading from '../common/text-heading.vue';
import WeightText from '../common/weight-text.vue';
import UserAvatar from '../users/user-avatar.vue';
import EquipmentIndicator from './equipment-indicator.vue';

interface ViewLogbookEntryProps {
  entry: LogEntryDTO;
  narrow?: boolean;
}

const props = withDefaults(defineProps<ViewLogbookEntryProps>(), {
  narrow: false,
});

function getFormattedDuration(duration: number | undefined): string {
  if (duration === undefined) return 'Unspecified';

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
