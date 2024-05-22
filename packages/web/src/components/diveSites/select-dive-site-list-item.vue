<template>
  <li
    class="odd:bg-blue-300/40 odd:dark:bg-blue-900/40 rounded-md p-2 space-y-2"
  >
    <button @click="() => $emit('select', site)">
      <p class="text-xl font-title capitalize hover:text-link-hover">
        {{ site.name }}
      </p>
    </button>

    <div class="flex ml-2">
      <p v-if="site.description" class="text-sm text-justify italic">
        {{ site.description }}
      </p>
    </div>

    <div class="flex justify-evenly text-sm">
      <div class="text-center">
        <p class="font-bold">Location</p>
        <p>{{ site.location }}</p>
      </div>

      <div class="text-center">
        <p class="font-bold">Max depth</p>
        <p v-if="site.depth">
          <DepthText :depth="site.depth.depth" :unit="site.depth.unit" />
        </p>
        <p v-else>(unspecified)</p>
      </div>

      <div class="text-center">
        <p class="font-bold">Free to dive</p>
        <p v-if="typeof site.freeToDive === 'boolean'">
          {{ site.freeToDive ? 'Yes' : 'No' }}
        </p>
        <p v-else>(unspecified)</p>
      </div>

      <div class="text-center">
        <p class="font-bold">Shore access</p>
        <p v-if="typeof site.shoreAccess === 'boolean'">
          {{ site.shoreAccess ? 'Yes' : 'No' }}
        </p>
        <p v-else>(unspecified)</p>
      </div>
    </div>

    <div class="flex justify-evenly text-sm">
      <div class="text-center">
        <p class="font-bold">Rating</p>
        <p v-if="site.averageRating">
          <StarRating :rating="site.averageRating" />
        </p>
        <p v-else>(unspecified)</p>
      </div>

      <div class="text-center">
        <p class="font-bold">Difficulty</p>
        <p v-if="site.averageDifficulty">
          <StarRating :rating="site.averageDifficulty" />
        </p>
        <p v-else>(unspecified)</p>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import DepthText from '../common/depth-text.vue';
import StarRating from '../common/star-rating.vue';

interface SelectDiveSiteListItemProps {
  site: DiveSiteDTO;
}

defineProps<SelectDiveSiteListItemProps>();
defineEmits<{
  (e: 'select', site: DiveSiteDTO): void;
}>();
</script>
