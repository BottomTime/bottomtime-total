<template>
  <div class="flex flex-col gap-0 relative">
    <a class="absolute -top-32" :name="site.id"></a>

    <!-- Site name and creator -->
    <div class="flex justify-between items-baseline">
      <FormButton
        type="link"
        :test-id="`select-site-${site.id}`"
        @click="$emit('site-selected', site)"
      >
        <h1 class="text-xl font-bold capitalize py-1.5">{{ site.name }}</h1>
      </FormButton>

      <UserAvatar :profile="site.creator" size="small" show-name />
    </div>

    <!-- Description -->
    <div class="text-sm text-justify italic">
      {{ site.description }}
    </div>

    <!-- Other info -->
    <div class="grid grid-cols-4 gap-3">
      <div class="flex flex-col items-center">
        <label class="font-bold">Location</label>
        <span>{{ site.location }}</span>
        <GpsCoordinatesText
          v-if="site.gps"
          class="text-xs font-mono"
          :coordinates="site.gps"
        />
      </div>

      <div class="flex flex-col items-center">
        <label class="font-bold">Depth</label>
        <DepthText
          v-if="site.depth"
          :depth="site.depth.depth"
          :unit="site.depth.unit"
        />
        <span v-else>Unspecified</span>
      </div>

      <div class="flex flex-col items-center">
        <label class="font-bold">Shore Dive</label>
        <span>{{ booleanString(site.shoreAccess) }}</span>
      </div>

      <div class="flex flex-col items-center">
        <label class="font-bold">Free to Dive</label>
        <span>{{ booleanString(site.freeToDive) }}</span>
      </div>

      <span class="flex flex-col items-center">
        <label class="font-bold">Rating</label>
        <StarRating :model-value="site.averageRating" readonly />
      </span>

      <span class="flex flex-col items-center">
        <label class="font-bold">Difficulty</label>
        <StarRating :model-value="site.averageDifficulty" readonly />
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO, WaterType } from '@bottomtime/api';

import { computed } from 'vue';

import DepthText from '../common/depth-text.vue';
import FormButton from '../common/form-button.vue';
import GpsCoordinatesText from '../common/gps-coordinates-text.vue';
import StarRating from '../common/star-rating.vue';
import UserAvatar from '../users/user-avatar.vue';

type DiveSitesListItemProps = {
  site: DiveSiteDTO;
};

const props = defineProps<DiveSitesListItemProps>();
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'user-selected', username: string): void;
}>();

const shoreAccess = computed(() => {
  if (typeof props.site.shoreAccess === 'boolean') {
    return props.site.shoreAccess ? 'Yes' : 'No';
  }
  return 'Unknown';
});

const freeToDive = computed(() => {
  if (typeof props.site.freeToDive === 'boolean') {
    return props.site.freeToDive ? 'Yes' : 'No';
  }
  return 'Unknown';
});

const waterType = computed(() => {
  switch (props.site.waterType) {
    case WaterType.Fresh:
      return 'Fresh water';
    case WaterType.Salt:
      return 'Salt water';
    case WaterType.Mixed:
      return 'Mixed';
    default:
      return 'Unknown';
  }
});

function booleanString(value?: boolean): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unspecified';
}
</script>
