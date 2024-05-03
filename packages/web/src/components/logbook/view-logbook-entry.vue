<template>
  <div v-if="entry" class="space-y-3">
    <div class="flex flex-col">
      <label class="font-bold">Log #:</label>
      <span class="italic">{{ entry.logNumber }}</span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Entry time:</label>
      <span class="italic">
        {{ entry.entryTime.date }}
        {{ entry.entryTime.timezone }}
      </span>
    </div>

    <div v-if="entry.maxDepth" class="flex flex-col">
      <label class="font-bold">Max depth:</label>
      <DepthText
        class="italic"
        :depth="entry.maxDepth.depth"
        :unit="entry.maxDepth.unit"
      />
    </div>

    <div v-if="entry.bottomTime" class="flex flex-col">
      <label class="font-bold">Bottom time / Duration:</label>
      <span class="italic">
        {{ `${entry.bottomTime.toFixed(1)}min` }} /
        {{ `${entry.duration.toFixed()}min` }}
      </span>
    </div>

    <div v-else class="flex flex-col">
      <label class="font-bold">Duration:</label>
      <span class="italic">{{ `${entry.duration.toFixed(1)}min` }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

import DepthText from '../common/depth-text.vue';

interface ViewLogbookEntryProps {
  entry: LogEntryDTO | null;
}

defineProps<ViewLogbookEntryProps>();
</script>
