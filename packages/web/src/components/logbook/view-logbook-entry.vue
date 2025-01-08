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

      <div v-if="entry.timing.bottomTime" class="flex flex-col gap-0.5">
        <label class="font-bold">Bottom time:</label>
        <span class="italic">
          {{ getFormattedDuration(entry.timing.bottomTime) }}
        </span>
      </div>

      <div v-if="entry.depths?.maxDepth" class="flex flex-col gap-0.5">
        <label class="font-bold">Maximum depth:</label>
        <DepthText
          class="italic"
          :depth="entry.depths.maxDepth"
          :unit="entry.depths.depthUnit || DepthUnit.Meters"
        />
      </div>

      <div v-if="entry.depths?.averageDepth" class="flex flex-col gap-0.5">
        <label class="font-bold">Average depth:</label>
        <DepthText
          class="italic"
          :depth="entry.depths.averageDepth"
          :unit="entry.depths.depthUnit || DepthUnit.Meters"
        />
      </div>
    </div>

    <div
      v-if="entry.depths?.averageDepth || entry.depths?.maxDepth"
      class="border-2 border-secondary p-2 rounded-md space-y-3"
    >
      <TextHeading level="h3">Conditions</TextHeading>
    </div>
  </div>

  <div class="space-y-3" data-testid="logbook-entry">
    <div v-if="entry.logNumber" class="flex flex-col">
      <label class="font-bold">Log #:</label>
      <span class="italic" data-testid="entry-logNumber">
        {{ entry.logNumber }}
      </span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Entry time:</label>
      <span class="italic">
        {{ dayjs(entry.timing.entryTime).format('LLL') }}
      </span>
      <span class="italic text-sm">({{ entry.timing.timezone }})</span>
    </div>

    <div v-if="entry.depths?.maxDepth" class="flex flex-col">
      <label class="font-bold">Max depth:</label>
      <DepthText
        class="italic"
        :depth="entry.depths.maxDepth"
        :unit="entry.depths.depthUnit || DepthUnit.Meters"
      />
    </div>

    <div v-if="entry.timing.bottomTime" class="flex flex-col">
      <label class="font-bold">Bottom time / Duration:</label>
      <span class="italic">
        {{ `${entry.timing.bottomTime.toFixed(1)} min` }} /
        {{ `${entry.timing.duration.toFixed(1)} min` }}
      </span>
    </div>

    <div v-else class="flex flex-col">
      <label class="font-bold">Duration:</label>
      <span class="italic">
        {{ `${entry.timing.duration.toFixed(1)} min` }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DepthUnit, LogEntryDTO } from '@bottomtime/api';

import dayjs from 'dayjs';

import DepthText from '../common/depth-text.vue';
import TextHeading from '../common/text-heading.vue';

interface ViewLogbookEntryProps {
  entry: LogEntryDTO;
  narrow?: boolean;
}

withDefaults(defineProps<ViewLogbookEntryProps>(), {
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
</script>
