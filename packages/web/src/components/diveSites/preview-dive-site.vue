<template>
  <div class="flex flex-col xl:flex-row gap-2 items-center">
    <article class="grow flex flex-col gap-4">
      <div class="flex flex-col lg:flex-row justify-between items-center">
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

        <StarRating :rating="site.averageRating" readonly />
      </div>

      <Transition name="slide-fade">
        <div v-if="isExpanded" class="grid grid-cols-4 gap-1.5 text-sm">
          <label class="font-bold text-right">Location:</label>
          <div class="col-span-3">
            <AddressText :address="site.location" />
            <p v-if="site.gps" class="space-x-1">
              <a
                :href="`https://www.google.com/maps/search/?api=1&query=${site.gps.lat},${site.gps.lon}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GpsCoordinatesText :coordinates="site.gps" />
              </a>
            </p>
          </div>

          <label class="font-bold text-right">Shore Dive:</label>
          <p>{{ yesNoBoolean(site.shoreAccess) }}</p>

          <label class="font-bold text-right">Free To Dive:</label>
          <p>{{ yesNoBoolean(site.freeToDive) }}</p>

          <label class="font-bold text-right">Depth:</label>
          <p>
            <DepthText
              v-if="site.depth"
              :depth="site.depth.depth"
              :unit="site.depth.unit"
            />
            <span v-else>Unspecified</span>
          </p>

          <label class="font-bold text-right">Water:</label>
          <p>{{ waterType }}</p>

          <label class="font-bold text-right">Difficulty:</label>
          <p class="col-span-3 space-x-2">
            <span v-if="site.averageDifficulty">
              {{ site.averageDifficulty.toFixed(1) }}/5.0
            </span>
            <span class="italic">{{ difficultyString }}</span>
          </p>
        </div>
      </Transition>

      <a
        class="space-x-1 text-sm"
        data-testid="expand-site-details"
        @click="isExpanded = !isExpanded"
      >
        <span v-if="isExpanded">
          <i class="fa-solid fa-caret-up"></i>
        </span>
        <span v-else>
          <i class="fa-solid fa-caret-down"></i>
        </span>
        <span>{{ isExpanded ? 'Hide details' : 'Show details' }}</span>
      </a>
    </article>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO, WaterType } from '@bottomtime/api';

import { computed, ref } from 'vue';

import AddressText from '../common/address-text.vue';
import DepthText from '../common/depth-text.vue';
import GpsCoordinatesText from '../common/gps-coordinates-text.vue';
import StarRating from '../common/star-rating.vue';

interface PreviewDiveSiteProps {
  site: DiveSiteDTO;
}

const props = defineProps<PreviewDiveSiteProps>();
defineEmits<{
  (e: 'select', site: DiveSiteDTO): void;
}>();

const isExpanded = ref(false);

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

function yesNoBoolean(value?: boolean) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unspecified';
}
</script>

<style lang="css" scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-30px);
  opacity: 0;
}
</style>
