<template>
  <ConfirmDialog
    v-if="state.currentReview"
    title="Delete Review?"
    confirm-text="Delete"
    :is-loading="state.isSavingReview"
    :visible="state.showConfirmDeleteReview"
    dangerous
    @confirm="onConfirmDeleteReview"
    @cancel="onCancelDeleteReview"
  >
    <p>
      <span>Are you sure you want to delete the review from </span>
      <span class="font-bold">{{
        dayjs(
          state.currentReview.updatedOn ?? state.currentReview.createdOn,
        ).format('LL')
      }}</span>
      <span>?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <div class="flex items-baseline gap-6">
    <UserAvatar :profile="site.creator" show-name />
    <p>{{ dayjs(site.createdOn).fromNow() }}</p>
  </div>

  <div class="`grid grid-cols-1 lg:grid-cols-2 gap-3`">
    <div class="space-y-3">
      <TextHeading>Location</TextHeading>
      <div class="flex gap-2 items-baseline">
        <p class="text-lg">{{ site.location }}</p>
        <p class="ml-2">
          <GpsCoordinatesText :coordinates="site.gps" />
        </p>
      </div>
      <div v-if="site.gps" class="mx-auto w-auto md:w-[640px] aspect-video">
        <GoogleMap :marker="site.gps" />
      </div>
    </div>

    <div class="space-y-3">
      <div v-if="site.directions">
        <TextHeading>Directions</TextHeading>
        <p>{{ site.directions }}</p>
      </div>

      <div v-if="site.description">
        <TextHeading>Description</TextHeading>
        <p>{{ site.description }}</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <label class="font-bold">Depth</label>
          <p class="mt-1.5">
            <span class="mr-1">
              <i class="fas fa-tachometer-alt fa-sm"></i>
            </span>
            <DepthText
              v-if="site.depth"
              :depth="site.depth.depth"
              :unit="site.depth.unit"
            />
            <span v-else>Unspecified</span>
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Shore Access</label>
          <p class="mt-1.5">
            <span class="mr-1">
              <i class="fas fa-anchor fa-sm"></i>
            </span>
            <span>{{ shoreAccess }}</span>
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Free To Dive</label>
          <div class="mt-1.5">
            <span class="mr-1">
              <i class="far fa-money-bill-alt fa-sm"></i>
            </span>
            <span>{{ freeToDive }}</span>
          </div>
        </div>

        <div class="text-center">
          <label class="font-bold">Water Type</label>
          <div class="mt-1.5">
            <span class="mr-1">
              <i class="fa-solid fa-droplet"></i>
            </span>
            <span>{{ waterType }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="col-span-1 lg:col-span-2 space-y-3">
      <TextHeading>Reviews</TextHeading>

      <FormBox class="flex flex-col gap-1 sticky top-16 z-[40]">
        <div
          class="flex flex-col items-center justify-start lg:flex-row lg:items-baseline lg:justify-between"
        >
          <p>
            <span>Showing </span>
            <span class="font-bold">{{ state.reviews.data.length }}</span>
            <span> of </span>
            <span class="font-bold">{{ state.reviews.totalCount }}</span>
            <span> reviews</span>
          </p>

          <div class="flex justify-center md:justify-end gap-2 items-baseline">
            <FormSelect
              v-model="state.sortOrder"
              control-id="site-reviews-sort-order"
              test-id="site-reviews-sort-order"
              :options="SortOptions"
            />
            <FormButton
              v-if="state.canSubmitReview"
              id="site-reviews-submit"
              data-testid="site-reviews-submit"
              type="primary"
              @click="onSubmitReview"
            >
              <p class="space-x-1">
                <span>
                  <i class="fa-regular fa-star"></i>
                </span>
                <span>Submit Review</span>
              </p>
            </FormButton>
          </div>
        </div>

        <div
          class="flex flex-col items-center justify-start lg:flex-row lg:items-baseline lg:justify-between"
        >
          <div class="flex gap-1">
            <label class="font-bold">Average Rating:</label>
            <StarRating :model-value="site.averageRating" readonly />
          </div>
          <div class="flex gap-1">
            <label class="font-bold ml-3">Average Difficulty:</label>
            <DifficultyText :difficulty="site.averageDifficulty" />
          </div>
        </div>
      </FormBox>

      <div v-if="state.isLoadingReviews" class="text-center text-lg my-8">
        <LoadingSpinner message="Fetching dive site reviews..." />
      </div>

      <TransitionList v-else class="px-2" data-testid="site-reviews-list">
        <li
          v-if="state.showEditReview && state.currentReview?.id === ''"
          ref="newReviewElement"
        >
          <TextHeading>Add a Review</TextHeading>
          <EditDiveSiteReview
            :review="state.currentReview"
            :is-saving="state.isSavingReview"
            @save="onSaveReview"
            @cancel="onCancelEditReview"
          />
        </li>

        <li
          v-if="state.reviews.data.length === 0"
          key="No Reviews"
          class="text-center text-lg my-8"
        >
          No reviews yet. <a @click="onSubmitReview">Add the first one!</a>
        </li>

        <DiveSiteReviewsListItem
          v-for="review in state.reviews.data"
          ref="reviewElements"
          :key="review.id"
          :review="review"
          :is-saving="state.isSavingReview"
          :edit-mode="
            state.showEditReview && state.currentReview?.id === review.id
          "
          @cancel="onCancelEditReview"
          @save="onSaveReview"
          @edit="onEditReview"
          @delete="onDeleteReview"
        />
      </TransitionList>

      <div
        v-if="state.reviews.data.length < state.reviews.totalCount"
        key="Load More Reviews"
        class="text-center my-8 text-lg"
      >
        <LoadingSpinner
          v-if="state.isLoadingMoreReviews"
          message="Fetching more reviews..."
        />
        <a
          v-else
          class="space-x-1"
          data-testid="site-reviews-load-more"
          @click="onLoadMore"
        >
          <span>
            <i class="fa-solid fa-arrow-down"></i>
          </span>
          <span>Load more</span>
        </a>
      </div>
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

import dayjs from 'src/dayjs';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';

import { useClient } from '../../api-client';
import { DefaultProfile, SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import DepthText from '../common/depth-text.vue';
import DifficultyText from '../common/difficulty-text.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormSelect from '../common/form-select.vue';
import GoogleMap from '../common/google-map.vue';
import GpsCoordinatesText from '../common/gps-coordinates-text.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import StarRating from '../common/star-rating.vue';
import TextHeading from '../common/text-heading.vue';
import TransitionList from '../common/transition-list.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import UserAvatar from '../users/user-avatar.vue';
import DiveSiteReviewsListItem from './dive-site-reviews-list-item.vue';
import EditDiveSiteReview from './edit-dive-site-review.vue';

type ViewDiveSiteProps = {
  columns?: boolean;
  site: DiveSiteDTO;
};

type ViewDiveSiteState = {
  canSubmitReview: boolean;
  currentReview?: DiveSiteReviewDTO;
  isLoadingMoreReviews: boolean;
  isLoadingReviews: boolean;
  isSavingReview: boolean;
  reviews: ApiList<DiveSiteReviewDTO>;
  showConfirmDeleteReview: boolean;
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
  rating: -1,
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
  canSubmitReview: false,
  isLoadingMoreReviews: false,
  isLoadingReviews: true,
  isSavingReview: false,
  reviews: {
    data: [],
    totalCount: 0,
  },
  showConfirmDeleteReview: false,
  showEditReview: false,
  sortOrder: SortOptions[0].value,
});
const newReviewElement = ref<HTMLLIElement | null>(null);
const reviewElements = ref<HTMLLIElement[]>([]);

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

async function onSubmitReview(): Promise<void> {
  state.currentReview = { ...DefaultReview };
  state.showEditReview = true;

  await nextTick();

  newReviewElement.value?.scrollIntoView?.({ behavior: 'smooth' });
}

async function onEditReview(review: DiveSiteReviewDTO): Promise<void> {
  state.currentReview = review;
  state.showEditReview = true;

  await nextTick();

  const index = state.reviews.data.findIndex((r) => r.id === review.id);
  if (index > -1) {
    reviewElements.value[index].scrollIntoView?.({ behavior: 'smooth' });
  }
}

function onCancelEditReview() {
  state.showEditReview = false;
}

async function onSaveReview(data: DiveSiteReviewDTO): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (data.id) {
      const updated = await client.diveSiteReviews.updateReview(
        props.site.id,
        data.id,
        data,
      );

      const index = state.reviews.data.findIndex((r) => r.id === data.id);
      if (index > -1) state.reviews.data.splice(index, 1, updated);

      state.showEditReview = false;
      toasts.success('site-review-modified', 'Review saved successfully!');
    } else {
      const newReview = await client.diveSiteReviews.createReview(
        props.site.id,
        data,
      );
      state.reviews.data.unshift(newReview);
      state.reviews.totalCount++;

      state.showEditReview = false;
      state.currentReview = undefined;
      toasts.success(
        'site-review-added',
        'Your review has been added. Thank you!',
      );

      await canSubmitReview();
    }
  });

  state.isSavingReview = false;
}

function onDeleteReview(review: DiveSiteReviewDTO) {
  state.currentReview = review;
  state.showConfirmDeleteReview = true;
}

function onCancelDeleteReview() {
  state.showConfirmDeleteReview = false;
}

async function onConfirmDeleteReview(): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (!state.currentReview) return;

    await client.diveSiteReviews.deleteReview(
      props.site.id,
      state.currentReview.id,
    );

    const index = state.reviews.data.findIndex(
      (r) => r.id === state.currentReview?.id,
    );
    if (index > -1) {
      state.reviews.data.splice(index, 1);
      state.reviews.totalCount--;
    }

    state.showConfirmDeleteReview = false;
    toasts.success(
      'site-review-deleted',
      'The review has been deleted successfully.',
    );

    await canSubmitReview();
  });

  state.isSavingReview = false;
}

function getListReviewsParams(skip?: number): ListDiveSiteReviewsParamsDTO {
  const [sortBy, sortOrder] = state.sortOrder.split('-') as [
    DiveSiteReviewsSortBy,
    SortOrder,
  ];
  return { sortBy, sortOrder, skip };
}

async function canSubmitReview(): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) {
      state.canSubmitReview = false;
      return;
    }

    const { data } = await client.diveSiteReviews.listReviews(props.site.id, {
      creator: currentUser.user.username,
      limit: 1,
      sortBy: DiveSiteReviewsSortBy.CreatedOn,
      sortOrder: SortOrder.Descending,
    });

    const twentyFourHoursAgo = Date.now() - 1000 * 60 * 60 * 24;
    const lastSubmission = data[0]?.updatedOn ?? data[0]?.createdOn ?? 0;
    state.canSubmitReview = twentyFourHoursAgo >= lastSubmission;
  });
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

async function onLoadMore(): Promise<void> {
  state.isLoadingMoreReviews = true;

  await oops(async () => {
    const results = await client.diveSiteReviews.listReviews(
      props.site.id,
      getListReviewsParams(state.reviews.data.length),
    );

    state.reviews.data.push(...results.data);
    state.reviews.totalCount = results.totalCount;
  });

  state.isLoadingMoreReviews = false;
}

onMounted(async () => {
  await Promise.all([refreshReviews(), canSubmitReview()]);
});

watch(() => state.sortOrder, refreshReviews);
</script>
