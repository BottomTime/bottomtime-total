<template>
  <FormBox class="space-y-3">
    <div class="flex justify-between items-baseline">
      <div class="flex gap-2 items-baseline">
        <button
          class="text-lg font-title capitalize hover:text-link-hover"
          data-testid="btn-site-name"
          @click="$emit('select')"
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
        <StarRating :rating="site.averageRating" />
      </div>
    </div>

    <div class="flex gap-6">
      <p class="space-x-3">
        <span class="text-danger">
          <i class="fa-solid fa-location-dot"></i>
        </span>
        <span class="font-bold">Location:</span>
        <span>{{ site.location }}</span>
        <span v-if="site.gps"> [{{ site.gps.lat }}, {{ site.gps.lon }}] </span>
      </p>
    </div>
  </FormBox>
</template>

<script lang="ts" setup>
import { SuccinctDiveSiteDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import StarRating from '../common/star-rating.vue';

interface PreviewDiveSiteProps {
  site: SuccinctDiveSiteDTO;
}

defineProps<PreviewDiveSiteProps>();
defineEmits<{
  (e: 'select'): void;
}>();
</script>
