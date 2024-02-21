<template>
  <FormBox class="flex flex-col gap-3">
    <div>
      <div class="text-center">
        <FormButton
          type="link"
          :test-id="`select-site-${site.id}`"
          @click="$emit('site-selected', site)"
        >
          <h1 class="text-2xl font-bold">{{ site.name }}</h1>
        </FormButton>
      </div>
      <div class="flex">
        <p class="grow">
          <span class="text-danger mr-2">
            <i class="fas fa-map-marker-alt fa-fw"></i>
          </span>
          <span>{{ site.location }}</span>
        </p>
        <p>
          <span class="mr-2">
            <i class="fas fa-user fa-fw"></i>
          </span>
          <span>{{ `@${site.creator.username}` }}</span>
        </p>
      </div>
    </div>
    <div class="text-sm text-justify italic grow">
      {{ site.description }}
    </div>
    <div class="flex gap-1.5 justify-evenly">
      <div v-if="site.depth" class="text-center">
        <p class="text-bold">Depth:</p>
        <p class="text-sm italic">
          <DepthText :depth="site.depth.depth" :unit="site.depth.unit" />
        </p>
      </div>
      <div v-if="typeof site.shoreAccess === 'boolean'" class="text-center">
        <p class="text-bold">Shore Access:</p>
        <p class="text-sm italic">
          {{ site.shoreAccess ? 'Yes' : 'No' }}
        </p>
      </div>
      <div v-if="typeof site.freeToDive === 'boolean'" class="text-center">
        <p class="text-bold">Free to Dive:</p>
        <p class="text-sm italic">
          {{ site.freeToDive ? 'Yes' : 'No' }}
        </p>
      </div>
    </div>
    <div class="flex items-center">
      <div v-if="site.averageRating" class="text-center">
        <p class="text-bold">Rating:</p>
        <p>
          <StarRating :rating="site.averageRating" />
        </p>
      </div>
      <div class="grow"></div>
      <div v-if="site.averageDifficulty" class="text-center">
        <p class="text-bold">Difficulty:</p>
        <p>
          <StarRating :rating="site.averageDifficulty" />
        </p>
      </div>
    </div>
  </FormBox>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import DepthText from '../common/depth-text.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import StarRating from '../common/star-rating.vue';

type DiveSitesListItemProps = {
  site: DiveSiteDTO;
};

defineProps<DiveSitesListItemProps>();
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();
</script>
