<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
    <div class="">
      <FormField label="Created by">
        <a href="#" class="flex space-x-2 items-center">
          <UserAvatar
            size="x-small"
            :avatar="site.creator.avatar"
            :display-name="site.creator.name || site.creator.username"
          />
          <span>{{ site.creator.name || `@${site.creator.username}` }}</span>
        </a>
      </FormField>

      <FormField label="Created on">
        <span>{{ dayjs(site.createdOn).fromNow() }}</span>
      </FormField>

      <FormField v-if="site.averageRating" label="Average rating">
        <StarRating :rating="site.averageRating" />
      </FormField>

      <FormField v-if="site.averageDifficulty" label="Difficulty rating">
        <StarRating :rating="site.averageDifficulty" />
      </FormField>
    </div>

    <div>
      <FormField v-if="site.depth" label="Depth">
        <span class="mr-1">
          <i class="fas fa-tachometer-alt fa-sm"></i>
        </span>
        <DepthText :depth="site.depth.depth" :unit="site.depth.unit" />
      </FormField>

      <FormField label="Shore access">
        <span class="mr-1">
          <i class="fas fa-anchor fa-sm"></i>
        </span>
        <span>{{ shoreAccess }}</span>
      </FormField>

      <FormField label="Free to dive">
        <span class="mr-1">
          <i class="far fa-money-bill-alt fa-sm"></i>
        </span>
        <span>{{ freeToDive }}</span>
      </FormField>
    </div>

    <div v-if="site.description" class="">
      <TextHeading>Description</TextHeading>
      <p>{{ site.description }}</p>
    </div>

    <div class="col-span-2 lg:col-span-1">
      <TextHeading>Location</TextHeading>
      <p class="font-bold">{{ site.location }}</p>
      <div v-if="site.gps">
        <GoogleMap :location="site.gps" />
        <FormField label="Coordinates" :responsive="false">
          <span>{{ site.gps.lat }}, {{ site.gps.lon }}</span>
        </FormField>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';
import { computed } from 'vue';

import DepthText from '../common/depth-text.vue';
import FormField from '../common/form-field.vue';
import GoogleMap from '../common/google-map.vue';
import StarRating from '../common/star-rating.vue';
import TextHeading from '../common/text-heading.vue';
import UserAvatar from '../users/user-avatar.vue';

type ViewDiveSiteProps = {
  site: DiveSiteDTO;
};

const props = defineProps<ViewDiveSiteProps>();

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
</script>
