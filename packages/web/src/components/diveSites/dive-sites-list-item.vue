<template>
  <li class="flex gap-2 items-center">
    <FormCheckbox
      v-if="selectable"
      :model-value="site.selected"
      :test-id="`select-site-${site.id}`"
      @update:model-value="$emit('toggle-selection', site)"
    />
    <div class="flex flex-col gap-0 grow relative">
      <a class="absolute -top-32" :name="site.id"></a>

      <!-- Site name and creator -->
      <div class="flex justify-between items-baseline gap-2">
        <FormButton
          class="text-pretty text-left"
          type="link"
          :test-id="`select-site-${site.id}`"
          @click="$emit('site-selected', site)"
        >
          <h1 class="text-xl font-bold capitalize py-1.5">{{ site.name }}</h1>
        </FormButton>

        <UserAvatar :profile="site.creator" size="small" show-name />
      </div>

      <!-- Description -->
      <div class="text-justify italic text-pretty my-2">
        {{ site.description }}
      </div>

      <!-- Other info -->
      <div class="flex flex-wrap gap-7 justify-evenly">
        <div class="flex flex-col items-center">
          <label class="font-bold">Location</label>
          <span>{{ site.location }}</span>
          <GpsCoordinatesText
            v-if="site.gps"
            class="text-xs font-mono"
            :coordinates="site.gps"
            link
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

        <div class="flex flex-col items-center">
          <label class="font-bold">Water Type</label>
          <span>{{ waterType }}</span>
        </div>
      </div>

      <!-- Rating and difficulty-->
      <div class="flex flex-wrap gap-7 justify-evenly my-1.5">
        <p class="flex items-baseline gap-1 min-w-fit">
          <label class="font-bold">Rating:</label>
          <StarRating :model-value="site.averageRating" readonly />
        </p>

        <p class="flex items-baseline gap-1 min-w-fit">
          <label class="font-bold">Difficulty:</label>
          <DifficultyText :difficulty="site.averageDifficulty" />
        </p>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteDTO, WaterType } from '@bottomtime/api';

import { computed } from 'vue';

import { Selectable } from '../../common';
import DepthText from '../common/depth-text.vue';
import DifficultyText from '../common/difficulty-text.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import GpsCoordinatesText from '../common/gps-coordinates-text.vue';
import StarRating from '../common/star-rating.vue';
import UserAvatar from '../users/user-avatar.vue';

type DiveSitesListItemProps = {
  selectable?: boolean;
  site: Selectable<DiveSiteDTO>;
};

const props = withDefaults(defineProps<DiveSitesListItemProps>(), {
  selectable: false,
});
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'user-selected', username: string): void;
  (e: 'toggle-selection', site: Selectable<DiveSiteDTO>): void;
}>();

const waterType = computed(() => {
  switch (props.site.waterType) {
    case WaterType.Fresh:
      return 'Fresh water';
    case WaterType.Salt:
      return 'Salt water';
    case WaterType.Mixed:
      return 'Brackish water';
    default:
      return 'Unspecified';
  }
});

function booleanString(value?: boolean): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unspecified';
}
</script>
