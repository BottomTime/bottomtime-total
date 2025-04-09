<template>
  <div class="flex flex-col gap-3">
    <TextHeading class="space-x-2">
      <span v-if="entry.logNumber">#{{ entry.logNumber }}:</span>
      <span>
        {{
          dayjs(entry.timing.entryTime).tz(entry.timing.timezone).format('LLL')
        }}
      </span>
      <span> ({{ entry.timing.timezone }}) </span>
    </TextHeading>

    <div class="flex justify-center">
      <UserAvatar :profile="entry.creator" show-name />
    </div>

    <div class="flex gap-10 justify-center flex-wrap">
      <div class="text-center">
        <label class="font-bold">Duration</label>
        <p>
          <DurationText :duration="entry.timing.duration" />
        </p>
      </div>

      <div class="text-center">
        <label class="font-bold">Max Depth</label>
        <p v-if="entry.depths?.maxDepth">
          <DepthText
            :depth="entry.depths.maxDepth"
            :unit="entry.depths.depthUnit"
          />
        </p>
        <p v-else>Unspecified</p>
      </div>

      <div class="text-center">
        <label class="font-bold">Dive Site</label>
        <p class="capitalize">{{ entry.site?.name || 'Unspecified' }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';

import DepthText from '../common/depth-text.vue';
import DurationText from '../common/duration-text.vue';
import TextHeading from '../common/text-heading.vue';
import UserAvatar from '../users/user-avatar.vue';

interface PreviewLogEntryProps {
  entry: LogEntryDTO;
}

defineProps<PreviewLogEntryProps>();
</script>
