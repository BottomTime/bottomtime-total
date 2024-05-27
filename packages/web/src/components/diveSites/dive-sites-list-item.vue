<template>
  <div
    class="flex flex-col gap-0 bg-gradient-to-b from-blue-200 to-blue-400 dark:from-blue-800 dark:to-blue-950 shadow-xl rounded-md border-blue-900 border-opacity-75 border-2 relative"
  >
    <a class="absolute -top-32" :name="site.id"></a>

    <!-- Site Name -->
    <div class="text-center bg-blue-200 rounded-t-md">
      <FormButton
        type="link"
        :test-id="`select-site-${site.id}`"
        @click="$emit('site-selected', site)"
      >
        <h1 class="text-2xl font-bold capitalize py-1.5">{{ site.name }}</h1>
      </FormButton>
    </div>

    <div class="flex flex-col gap-3 p-3 grow">
      <!-- Location and creator -->
      <div class="flex align-baseline items-baseline">
        <p class="grow">
          <span class="text-danger mr-2">
            <i class="fas fa-map-marker-alt fa-fw"></i>
          </span>
          <span>{{ site.location }}</span>
        </p>
        <p>
          <FormButton
            type="link"
            size="lg"
            :test-id="`site-creator-${site.id}`"
            @click="$emit('user-selected', site.creator.username)"
          >
            <span class="mr-2">
              <i class="fas fa-user fa-fw"></i>
            </span>
            <span>{{ `@${site.creator.username}` }}</span>
          </FormButton>
        </p>
      </div>

      <!-- Description -->
      <div class="text-sm text-justify italic">
        {{ site.description }}
      </div>

      <!-- Shim to force the rest of the content to the bottom -->
      <div class="grow"></div>

      <!-- Depth, shore access, free to dive -->
      <div class="flex gap-1.5 justify-evenly">
        <div v-if="site.depth" class="text-center">
          <p class="font-bold">Depth:</p>
          <p class="text-sm italic">
            <DepthText :depth="site.depth.depth" :unit="site.depth.unit" />
          </p>
        </div>
        <div v-if="typeof site.shoreAccess === 'boolean'" class="text-center">
          <p class="font-bold">Shore Access:</p>
          <p class="text-sm italic">
            {{ site.shoreAccess ? 'Yes' : 'No' }}
          </p>
        </div>
        <div v-if="typeof site.freeToDive === 'boolean'" class="text-center">
          <p class="font-bold">Free to Dive:</p>
          <p class="text-sm italic">
            {{ site.freeToDive ? 'Yes' : 'No' }}
          </p>
        </div>
      </div>

      <!-- Rating and difficulty -->
      <div class="flex items-center justify-evenly">
        <div v-if="site.averageRating" class="text-center">
          <p class="font-bold">Rating:</p>
          <p>
            <StarRating :rating="site.averageRating" />
          </p>
        </div>
        <div class="grow"></div>
        <div v-if="site.averageDifficulty" class="text-center">
          <p class="font-bold">Difficulty:</p>
          <p>
            <StarRating :rating="site.averageDifficulty" />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import DepthText from '../common/depth-text.vue';
import FormButton from '../common/form-button.vue';
import StarRating from '../common/star-rating.vue';

type DiveSitesListItemProps = {
  site: DiveSiteDTO;
};

defineProps<DiveSitesListItemProps>();
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'user-selected', username: string): void;
}>();
</script>
