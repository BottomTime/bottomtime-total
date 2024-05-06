<template>
  <li
    class="flex space-x-3 min-h-24 items-center even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="min-w-16 flex">
      <FormCheckbox
        v-if="editMode"
        :control-id="`select-${entry.id}`"
        :test-id="`select-${entry.id}`"
      />
      <p v-if="entry.logNumber" class="font-bold">#{{ entry.logNumber }}</p>
    </div>

    <div class="flex flex-col gap-3 grow">
      <p
        class="flex flex-col gap-0.5 md:flex-row md:gap-2 items-center md:items-baseline w-full"
      >
        <FormButton
          type="link"
          size="2xl"
          :test-id="`select-${entry.id}`"
          @click="$emit('select', entry)"
        >
          {{ dayjs(entry.entryTime.date).format('LLL') }}
        </FormButton>
        <span class="italic text-sm">{{ entry.entryTime.timezone }}</span>
      </p>

      <div
        class="flex flex-col justify-start gap-0 lg:flex-row lg:justify-between"
      >
        <div v-if="entry.bottomTime" class="flex space-x-2">
          <p class="font-bold min-w-40 text-right lg:min-w-0 lg:text-left">
            Bottom time / Duration:
          </p>
          <span class="italic">
            {{ `${entry.bottomTime.toFixed(1)}min` }} /
            {{ `${entry.duration.toFixed(1)}min` }}
          </span>
        </div>

        <div v-else class="flex space-x-2">
          <p class="font-bold min-w-40 text-right lg:min-w-0 lg:text-left">
            Duration:
          </p>
          <span class="italic">
            {{ `${entry.duration.toFixed(1)}min` }}
          </span>
        </div>

        <div v-if="entry.maxDepth" class="flex space-x-2">
          <p class="font-bold min-w-40 text-right lg:min-w-0 lg:text-left">
            Max depth:
          </p>
          <DepthText
            class="italic"
            :depth="entry.maxDepth.depth"
            :unit="entry.maxDepth.unit"
          />
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

import dayjs from 'dayjs';

import DepthText from '../common/depth-text.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';

interface LogbookEntriesListItemProps {
  editMode?: boolean;
  entry: LogEntryDTO;
}

withDefaults(defineProps<LogbookEntriesListItemProps>(), {
  editMode: false,
});
defineEmits<{
  (e: 'select', entry: LogEntryDTO): void;
}>();
</script>
