<template>
  <div v-if="entry" class="space-y-3" data-testid="logbook-entry">
    <div v-if="entry.logNumber" class="flex flex-col">
      <label class="font-bold">Log #:</label>
      <span class="italic" data-testid="entry-logNumber">
        {{ entry.logNumber }}
      </span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Entry time:</label>
      <span class="italic">
        {{ dayjs(entry.timing.entryTime.date).format('LLL') }}
      </span>
      <span class="italic text-sm"
        >({{ entry.timing.entryTime.timezone }})</span
      >
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

interface ViewLogbookEntryProps {
  entry: LogEntryDTO | null;
}

defineProps<ViewLogbookEntryProps>();
</script>
