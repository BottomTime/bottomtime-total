<template>
  <div :class="`grid grid-cols-1 ${columns ? 'lg:grid-cols-2 ' : ''}gap-3`">
    <div>
      <FormField v-if="site.averageRating" label="Average rating">
        <StarRating class="mt-2" :rating="site.averageRating" />
      </FormField>

      <FormField v-if="site.averageDifficulty" label="Difficulty rating">
        <StarRating class="mt-2" :rating="site.averageDifficulty" />
      </FormField>
    </div>

    <div>
      <FormField v-if="site.depth" label="Depth">
        <div class="mt-1.5">
          <span class="mr-1">
            <i class="fas fa-tachometer-alt fa-sm"></i>
          </span>
          <DepthText :depth="site.depth.depth" :unit="site.depth.unit" />
        </div>
      </FormField>

      <FormField label="Shore access">
        <div class="mt-1.5">
          <span class="mr-1">
            <i class="fas fa-anchor fa-sm"></i>
          </span>
          <span>{{ shoreAccess }}</span>
        </div>
      </FormField>

      <FormField label="Free to dive">
        <div class="mt-1.5">
          <span class="mr-1">
            <i class="far fa-money-bill-alt fa-sm"></i>
          </span>
          <span>{{ freeToDive }}</span>
        </div>
      </FormField>

      <FormField label="Water type" control-id="waterType">
        <div class="mt-1.5">
          <span class="mr-1">
            <i class="fa-solid fa-droplet"></i>
          </span>
          <span>{{ waterType }}</span>
        </div>
      </FormField>
    </div>

    <div class="space-y-3">
      <TextHeading>Location</TextHeading>
      <div class="flex gap-2 items-baseline">
        <p class="text-lg">{{ site.location }}</p>
        <p class="ml-2">
          <span class="mr-1 text-danger">
            <i class="fas fa-map-marker-alt fa-sm"></i>
          </span>
          <span v-if="site.gps">{{ site.gps.lat }}, {{ site.gps.lon }}</span>
        </p>
      </div>
      <div v-if="site.gps" class="mx-auto">
        <GoogleMap :marker="site.gps" />
      </div>
    </div>

    <div v-if="site.description || site.directions" class="space-y-3">
      <div v-if="site.directions">
        <TextHeading>Directions</TextHeading>
        <p>{{ site.directions }}</p>
      </div>

      <div v-if="site.description">
        <TextHeading>Description</TextHeading>
        <p>{{ site.description }}</p>
      </div>

      <div class="flex justify-evenly gap-6">
        <FormField label="Created by" :responsive="false">
          <a href="#" class="flex space-x-2 items-center">
            <UserAvatar
              size="x-small"
              :avatar="site.creator.avatar ?? undefined"
              :display-name="site.creator.name || site.creator.username"
            />
            <span>{{ site.creator.name || `@${site.creator.username}` }}</span>
          </a>
        </FormField>

        <FormField label="Created" :responsive="false">
          <span>{{ dayjs(site.createdOn).fromNow() }}</span>
        </FormField>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO, WaterType } from '@bottomtime/api';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { computed } from 'vue';

import DepthText from '../common/depth-text.vue';
import FormField from '../common/form-field.vue';
import GoogleMap from '../common/google-map.vue';
import StarRating from '../common/star-rating.vue';
import TextHeading from '../common/text-heading.vue';
import UserAvatar from '../users/user-avatar.vue';

dayjs.extend(relativeTime);

type ViewDiveSiteProps = {
  columns?: boolean;
  site: DiveSiteDTO;
};

const props = withDefaults(defineProps<ViewDiveSiteProps>(), {
  columns: true,
});

const freeToDive = computed(() => {
  if (props.site.freeToDive === true) {
    return 'Free to dive';
  }

  if (props.site.freeToDive === false) {
    return 'Fee required';
  }

  return 'Unknown';
});

const shoreAccess = computed(() => {
  if (props.site.shoreAccess === true) {
    return 'Accessible from shore';
  }

  if (props.site.shoreAccess === false) {
    return 'Boat required';
  }

  return 'Unknown';
});

const waterType = computed(() => {
  switch (props.site.waterType) {
    case WaterType.Salt:
      return 'Salt water';
    case WaterType.Fresh:
      return 'Fresh water';
    case WaterType.Mixed:
      return 'Mixed';
    default:
      return 'Unknown';
  }
});
</script>
