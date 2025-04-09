<template>
  <li
    class="flex space-x-3 min-h-24 items-center even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="min-w-16 flex">
      <FormCheckbox
        v-if="editMode"
        :model-value="entry.selected"
        :control-id="`toggle-${entry.id}`"
        :test-id="`toggle-${entry.id}`"
        @update:model-value="$emit('toggle-select', entry)"
      />
      <p v-if="entry.logNumber" class="font-bold">#{{ entry.logNumber }}</p>
    </div>

    <div class="flex flex-col gap-3 grow">
      <div
        class="flex flex-col md:flex-row justify-between items-center md:items-baseline"
      >
        <p
          class="flex flex-col gap-0.5 md:flex-row md:gap-2 items-center md:items-baseline w-full"
        >
          <a
            :id="`${entry.id}`"
            class="text-2xl"
            :href="`#${entry.id}`"
            :data-testid="`select-${entry.id}`"
            @click="$emit('highlight', entry)"
          >
            {{ dayjs(entry.timing.entryTime).format('LLL') }}
          </a>
          <span class="italic text-sm">({{ entry.timing.timezone }})</span>
        </p>

        <StarRating :model-value="entry.rating" readonly />
      </div>

      <div v-if="entry.notes" class="text-pretty">
        {{ entry.notes }}
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
        <div class="text-center col-span-2 md:col-span-4 xl:col-span-2">
          <label class="font-bold">Dive Site</label>
          <div v-if="entry.site" class="italic capitalize">
            <p>{{ entry.site.name }}</p>
            <p>{{ entry.site.location }}</p>
          </div>
          <p v-else class="italic">Unspecified</p>
        </div>

        <div class="text-center">
          <label class="font-bold">Duration</label>
          <p class="italic">
            <DurationText :duration="entry.timing.duration" />
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Bottom time</label>
          <p class="italic">
            <DurationText :duration="entry.timing.bottomTime" />
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Max Depth</label>
          <p v-if="entry.depths?.maxDepth">
            <DepthText
              v-if="entry.depths?.maxDepth"
              class="italic"
              :depth="entry.depths.maxDepth"
              :unit="entry.depths.depthUnit || DepthUnit.Meters"
            />
          </p>
          <p v-else class="italic">Unspecified</p>
        </div>

        <div class="text-center">
          <label class="font-bold">Average Depth</label>
          <p v-if="entry.depths?.averageDepth">
            <DepthText
              v-if="entry.depths?.averageDepth"
              class="italic"
              :depth="entry.depths.averageDepth"
              :unit="entry.depths.depthUnit || DepthUnit.Meters"
            />
          </p>
          <p v-else class="italic">Unspecified</p>
        </div>
      </div>

      <div v-if="entry.tags?.length" class="flex justify-center">
        <FormTags :model-value="entry.tags" readonly />
      </div>
    </div>

    <div v-if="editMode" class="min-w-fit">
      <FormButton
        :test-id="`edit-entry-${entry.id}`"
        rounded="left"
        @click="$emit('edit', entry)"
      >
        <span>
          <i class="fa-solid fa-pen"></i>
        </span>
        <span class="sr-only">Edit</span>
      </FormButton>
      <FormButton
        :test-id="`delete-entry-${entry.id}`"
        type="danger"
        rounded="right"
        @click="$emit('delete', entry)"
      >
        <span>
          <i class="fa-solid fa-trash"></i>
        </span>
        <span class="sr-only">Delete</span>
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { DepthUnit, LogEntryDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';

import { Selectable } from '../../common';
import DepthText from '../common/depth-text.vue';
import DurationText from '../common/duration-text.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import FormTags from '../common/form-tags.vue';
import StarRating from '../common/star-rating.vue';

interface LogbookEntriesListItemProps {
  editMode?: boolean;
  entry: Selectable<LogEntryDTO>;
}

withDefaults(defineProps<LogbookEntriesListItemProps>(), {
  editMode: false,
});
defineEmits<{
  (e: 'edit', entry: LogEntryDTO): void;
  (e: 'delete', entry: LogEntryDTO): void;
  (e: 'highlight', entry: LogEntryDTO): void;
  (e: 'toggle-select', entry: LogEntryDTO): void;
}>();
</script>
