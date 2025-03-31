<template>
  <li class="flex gap-3">
    <FormCheckbox
      :model-value="entry.selected ?? false"
      @update:model-value="$emit('toggle-select', entry, !entry.selected)"
    >
      <span class="sr-only">
        Select entry {{ entry.logNumber }} from
        {{ dayjs(entry.timing.entryTime).format('LLL') }} ({{
          entry.timing.timezone
        }})
      </span>
    </FormCheckbox>

    <div class="grow">
      <div>
        <a
          :id="`e-${entry.id}`"
          :href="`#e-${entry.id}`"
          class="space-x-2 font-title text-lg"
        >
          <span v-if="entry.logNumber" class=""> #{{ entry.logNumber }} </span>
          <span>{{ dayjs(entry.timing.entryTime).format('LLL') }}</span>
        </a>
      </div>

      <div class="mx-2 grid grid-cols-3 gap-3">
        <div v-if="entry.site" class="text-center">
          <p class="font-bold">Dive Site / Location</p>
          <div class="capitalize">
            <p>{{ entry.site.name }},</p>
            <p>{{ entry.site.location }}</p>
          </div>
        </div>

        <div class="text-center">
          <p class="font-bold">Duration</p>
          <p>
            <DurationText :duration="entry.timing.duration" />
          </p>
        </div>

        <div v-if="entry.depths?.maxDepth" class="text-center">
          <p class="font-bold">Max Depth</p>
          <p>
            <DepthText
              :depth="entry.depths.maxDepth"
              :unit="entry.depths.depthUnit"
            />
          </p>
        </div>
      </div>

      <div v-if="entry.tags?.length">
        <FormTags :tags="entry.tags" readonly />
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { VerySuccinctLogEntryDTO } from '@bottomtime/api';

import { Selectable } from 'src/common';
import dayjs from 'src/dayjs';

import DepthText from '../common/depth-text.vue';
import DurationText from '../common/duration-text.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import FormTags from '../common/form-tags.vue';

interface ExportLogbookListItemProps {
  entry: Selectable<VerySuccinctLogEntryDTO>;
}

defineProps<ExportLogbookListItemProps>();
defineEmits<{
  (
    e: 'toggle-select',
    entry: Selectable<VerySuccinctLogEntryDTO>,
    selected: boolean,
  ): void;
}>();
</script>
