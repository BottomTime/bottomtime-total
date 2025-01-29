<template>
  <DrawerPanel
    v-if="state.currentReview"
    :title="state.currentReview.id ? 'Edit Review' : 'Add Review'"
    :visible="state.showEditReview"
    @close="onCancelEditReview"
  >
    <EditDiveSiteReview
      :review="state.currentReview"
      :is-saving="state.isSavingReview"
      @save="onSaveReview"
      @cancel="onCancelEditReview"
    />
  </DrawerPanel>

  <div :class="`grid grid-cols-1 ${columns ? 'lg:grid-cols-2 ' : ''}gap-3`">
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

    <div class="col-span-1 lg:col-span-2">
      <TextHeading>Reviews</TextHeading>

      <FormBox class="flex justify-between items-baseline sticky top-16 z-[40]">
        <p>
          <span>Showing </span>
          <span class="font-bold">{{ state.reviews.data.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ state.reviews.totalCount }}</span>
          <span> reviews</span>
        </p>

        <div>
          <div><!-- TODO Average rating/difficulty --></div>
          <div class="flex gap-2 items-baseline">
            <FormSelect
              v-model="state.sortOrder"
              control-id="site-reviews-sort-order"
              test-id="site-reviews-sort-order"
              :options="SortOptions"
            />
            <FormButton type="primary" @click="onSubmitReview">
              <p class="space-x-1">
                <span>
                  <i class="fa-regular fa-star"></i>
                </span>
                <span>Submit Review</span>
              </p>
            </FormButton>
          </div>
        </div>
      </FormBox>

      <div v-if="state.isLoadingReviews" class="text-center text-lg my-8">
        <LoadingSpinner message="Fetching dive site reviews..." />
      </div>

      <TransitionList v-else class="px-2">
        <li
          v-if="state.reviews.data.length === 0"
          key="No Reviews"
          class="text-center text-lg my-8"
        >
          No reviews yet. <a @click="onSubmitReview">Add the first one!</a>
        </li>

        <DiveSiteReviewsListItem
          v-for="review in state.reviews.data"
          :key="review.id"
          :review="review"
        />
      </TransitionList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ApiList,
  DiveSiteDTO,
  DiveSiteReviewDTO,
  DiveSiteReviewsSortBy,
  ListDiveSiteReviewsParamsDTO,
  SortOrder,
  WaterType,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { computed, onMounted, reactive, watch } from 'vue';

import { useClient } from '../../api-client';
import { DefaultProfile, SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import DepthText from '../common/depth-text.vue';
import DrawerPanel from '../common/drawer-panel.vue';
import EditDiveSiteReview from '../common/edit-dive-site-review.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import GoogleMap from '../common/google-map.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TextHeading from '../common/text-heading.vue';
import TransitionList from '../common/transition-list.vue';
import UserAvatar from '../users/user-avatar.vue';
import DiveSiteReviewsListItem from './dive-site-reviews-list-item.vue';

dayjs.extend(relativeTime);

type ViewDiveSiteProps = {
  columns?: boolean;
  site: DiveSiteDTO;
};

type ViewDiveSiteState = {
  currentReview?: DiveSiteReviewDTO;
  isLoadingReviews: boolean;
  isSavingReview: boolean;
  reviews: ApiList<DiveSiteReviewDTO>;
  showEditReview: boolean;
  sortOrder: string;
};

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const toasts = useToasts();

const DefaultReview: DiveSiteReviewDTO = {
  createdOn: Date.now(),
  creator: currentUser.user?.profile ?? DefaultProfile,
  id: '',
  rating: 0,
};

const SortOptions: SelectOption[] = [
  {
    label: 'Age (most recent to oldest)',
    value: `${DiveSiteReviewsSortBy.CreatedOn}-${SortOrder.Descending}`,
  },
  {
    label: 'Age (oldest to most recent)',
    value: `${DiveSiteReviewsSortBy.CreatedOn}-${SortOrder.Ascending}`,
  },
  {
    label: 'Rating (highest to lowest)',
    value: `${DiveSiteReviewsSortBy.Rating}-${SortOrder.Descending}`,
  },
  {
    label: 'Rating (lowest to highest)',
    value: `${DiveSiteReviewsSortBy.Rating}-${SortOrder.Ascending}`,
  },
];

const props = withDefaults(defineProps<ViewDiveSiteProps>(), {
  columns: true,
});
const state = reactive<ViewDiveSiteState>({
  isLoadingReviews: true,
  isSavingReview: false,
  reviews: {
    data: [],
    totalCount: 0,
  },
  showEditReview: false,
  sortOrder: SortOptions[0].value,
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

function onSubmitReview() {
  state.currentReview = { ...DefaultReview };
  state.showEditReview = true;
}

function onCancelEditReview() {
  state.showEditReview = false;
}

async function onSaveReview(data: DiveSiteReviewDTO): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (data.id) {
      // TODO
    } else {
      const newReview = await client.diveSiteReviews.createReview(
        props.site.id,
        data,
      );
      state.reviews.data.unshift(newReview);
      state.reviews.totalCount++;

      toasts.success('review-added', 'Your review has been added. Thank you!');

      state.showEditReview = false;
    }
  });

  state.isSavingReview = false;
}

function getListReviewsParams(): ListDiveSiteReviewsParamsDTO {
  const [sortBy, sortOrder] = state.sortOrder.split('-') as [
    DiveSiteReviewsSortBy,
    SortOrder,
  ];
  return { sortBy, sortOrder };
}

async function refreshReviews(): Promise<void> {
  state.isLoadingReviews = true;

  await oops(async () => {
    state.reviews = await client.diveSiteReviews.listReviews(
      props.site.id,
      getListReviewsParams(),
    );
  });

  state.isLoadingReviews = false;
}

onMounted(refreshReviews);

watch(() => state.sortOrder, refreshReviews);
</script>
