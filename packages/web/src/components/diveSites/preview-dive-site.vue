<template>
  <div class="flex gap-3">
    <figure class="min-w-[64px] min-h-[64px]">
      <!-- TODO: Icon? Logo? -->
    </figure>

    <article class="grow flex flex-col gap-4">
      <div class="flex justify-between items-baseline">
        <div class="flex gap-2 items-baseline">
          <button
            class="text-xl font-title capitalize hover:text-link-hover"
            data-testid="btn-site-name"
            @click="$emit('select', site)"
          >
            {{ site.name }}
          </button>

          <a :href="`/diveSites/${site.id}`" target="_blank">
            <span>
              <i class="fa-solid fa-up-right-from-square fa-sm"></i>
            </span>
            <span class="sr-only">Open site "{{ site.name }}" in new tab</span>
          </a>
        </div>

        <div v-if="site.averageRating">
          <StarRating :rating="site.averageRating" readonly />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2">
          <span class="sr-only">Location</span>
          <p>{{ site.location }}</p>
          <p v-if="site.gps" class="space-x-1">
            <span class="text-danger">
              <i class="fa-solid fa-location-dot"></i>
            </span>
            <a
              class="text-sm font-mono"
              :href="`https://www.google.com/maps/search/?api=1&query=${site.gps.lat},${site.gps.lon}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ site.gps.lat }}{{ site.gps.lat > 0 ? 'N' : 'S' }},
              {{ site.gps.lon }}{{ site.gps.lon > 0 ? 'E' : 'W' }}
            </a>
          </p>
        </div>

        <div>
          <p class="font-bold">Depth</p>
          <p>
            <DepthText
              v-if="site.depth"
              :depth="site.depth.depth"
              :unit="site.depth.unit"
            />
            <span v-else>Unspecified</span>
          </p>
        </div>

        <div>
          <p class="font-bold">Shore Dive</p>
          <span>{{ yesNoBoolean(site.shoreAccess) }}</span>
        </div>

        <div>
          <p class="font-bold">Free To Dive</p>
          <span>{{ yesNoBoolean(site.freeToDive) }}</span>
        </div>

        <div>
          <p class="font-bold">Difficulty</p>
          <p v-if="site.averageDifficulty">
            {{ site.averageDifficulty.toFixed(1) }}/5.0
          </p>
          <p>{{ difficultyString }}</p>
        </div>
      </div>
    </article>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { computed } from 'vue';

import DepthText from '../common/depth-text.vue';
import StarRating from '../common/star-rating.vue';

interface PreviewDiveSiteProps {
  site: DiveSiteDTO;
}

const props = defineProps<PreviewDiveSiteProps>();
defineEmits<{
  (e: 'select', site: DiveSiteDTO): void;
}>();

const difficultyString = computed(() => {
  if (!props.site.averageDifficulty) return 'Not rated';

  const rounded = Math.round(props.site.averageDifficulty);
  if (rounded === 5)
    return 'Extreme! Technical or very experienced divers only!';
  if (rounded === 4) return 'Challenging. Experienced divers only';
  if (rounded === 3) return 'Moderate. Advanced open water is recommended';
  if (rounded === 2) return 'No sweat! Most divers can handle it!';
  return 'Easy-peasy! Any diver can handle it.';
});

function yesNoBoolean(value?: boolean) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unspecified';
}
</script>
