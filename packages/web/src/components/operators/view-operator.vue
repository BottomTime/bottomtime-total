<template>
  <DrawerPanel
    v-if="state.currentReview"
    :title="state.currentReview.id ? 'Edit Review' : 'Add Review'"
    :visible="state.showEditReview"
    @close="onCancelEditReview"
  >
    <EditOperatorReview
      :review="state.currentReview"
      :is-saving="state.isSavingReview"
      @cancel="onCancelEditReview"
      @save="onConfirmEditReview"
    />
  </DrawerPanel>

  <ConfirmDialog
    v-if="state.currentReview"
    title="Delete Review?"
    confirm-text="Delete"
    :visible="state.showConfirmDeleteReview"
    :is-loading="state.isSavingReview"
    dangerous
    @confirm="onConfirmDeleteReview"
    @cancel="onCancelDeleteReview"
  >
    <p>
      Are you sure you want to delete your review from
      <span class="font-bold">
        {{ dayjs(state.currentReview.updatedAt).format('LL') }}
      </span>
      ?
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <div class="flex gap-6" data-testid="view-operator-section">
    <div class="m-2 w-[128px] h-[128px]">
      <p v-if="operator.logo">
        <img
          :src="`${operator.logo}/128x128`"
          class="rounded-md"
          width="128px"
          height="128px"
        />
      </p>
      <p v-else>
        <i class="fa-regular fa-image fa-5x"></i>
      </p>
    </div>

    <article class="space-y-3">
      <PillLabel
        v-if="operator.verificationStatus === VerificationStatus.Verified"
        type="success"
        class="text-xl"
        data-testid="operator-verified"
      >
        <span>
          <i class="fa-solid fa-check"></i>
        </span>
        <span>Verified!</span>
      </PillLabel>

      <p class="text-lg">
        {{ operator.description }}
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="space-y-2 px-3">
          <TextHeading level="h3">Contact Info</TextHeading>

          <p class="space-x-2">
            <span>
              <i class="fa-solid fa-map-marker-alt fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Address</span>
            <span>{{ operator.address }}</span>
          </p>

          <p v-if="operator.phone" class="space-x-2">
            <span>
              <i class="fa-solid fa-phone fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Phone Number</span>
            <NavLink :to="phoneUri">{{ formattedPhone }}</NavLink>
          </p>

          <p v-if="operator.email" class="space-x-2">
            <span>
              <i class="fa-solid fa-envelope fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Email</span>
            <NavLink :to="`mailto:${operator.email}`">
              {{ operator.email }}
            </NavLink>
          </p>

          <p v-if="operator.website" class="space-x-2">
            <span>
              <i class="fa-solid fa-globe fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Website</span>
            <NavLink :to="operator.website" new-tab>
              {{ operator.website }}
            </NavLink>
          </p>
        </div>

        <div v-if="showSocials" class="space-y-2 px-3">
          <TextHeading level="h3">Socials</TextHeading>

          <p v-if="operator.socials?.facebook" class="space-x-2">
            <span>
              <i class="fa-brands fa-facebook fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Facebook</span>
            <NavLink
              :to="`https://facebook.com/${operator.socials.facebook}/`"
              new-tab
            >
              {{ operator.socials.facebook }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.instagram" class="space-x-2">
            <span>
              <i class="fa-brands fa-instagram fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Instagram</span>
            <NavLink
              :to="`https://instagram.com/${operator.socials.instagram}/`"
              new-tab
            >
              {{ operator.socials.instagram }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.tiktok" class="space-x-2">
            <span>
              <i class="fa-brands fa-tiktok fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">TikTok</span>
            <NavLink
              :to="`https://tiktok.com/@${operator.socials.tiktok}/`"
              new-tab
            >
              {{ operator.socials.tiktok }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.twitter" class="space-x-2">
            <span>
              <i class="fa-brands fa-x-twitter fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">X</span>
            <NavLink :to="`https://x.com/${operator.socials.twitter}/`" new-tab>
              {{ operator.socials.twitter }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.youtube" class="space-x-2">
            <span>
              <i class="fa-brands fa-youtube fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">YouTube</span>
            <NavLink
              :to="`https://youtube.com/channel/${operator.socials.youtube}/`"
              new-tab
            >
              {{ operator.socials.youtube }}
            </NavLink>
          </p>
        </div>
      </div>
    </article>
  </div>

  <div class="space-y-3">
    <TextHeading>Reviews</TextHeading>

    <FormBox
      class="flex flex-col gap-1 md:flex-row justify-between items-center md:items-baseline sticky top-16 z-[40]"
    >
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ state.reviews.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.reviews.totalCount }}</span>
        <span> reviews</span>
      </p>

      <div
        class="flex flex-col gap-1 xl:flex-row xl:gap-3 items-center md:items-end xl:items-baseline"
      >
        <div class="flex flex-wrap gap-2 items-baseline">
          <p class="font-bold">Rating:</p>
          <StarRating :model-value="operator.averageRating" readonly />
        </div>

        <div
          class="flex flex-col lg:flex-row items-center md:items-end lg:items-baseline gap-3"
        >
          <FormSelect
            v-model="state.sortOrder"
            control-id="reviews-sort-order"
            test-id="reviews-sort-order"
            :options="SortOptions"
          />
          <FormButton
            v-if="state.canSubmitReview"
            type="primary"
            control-id="btn-new-review"
            test-id="btn-new-review"
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
    </FormBox>

    <div v-if="state.isLoadingReviews" class="text-center my-8 text-lg">
      <LoadingSpinner message="Fetching customer reviews..." />
    </div>

    <TransitionList v-else class="px-2">
      <li v-if="state.reviews.data.length === 0" key="No Reviews">
        <p class="text-center text-lg my-8">
          No reviews yet. <a @click="onSubmitReview">Be the first!</a>
        </p>
      </li>

      <OperatorReviewsListItem
        v-for="review in state.reviews.data"
        :key="review.id"
        :review="review"
        @edit="onEditReview"
        @delete="onDeleteReview"
      />

      <li
        v-if="state.reviews.data.length < state.reviews.totalCount"
        key="Load More"
        class="text-lg text-center my-4"
      >
        <LoadingSpinner
          v-if="state.isLoadingMore"
          message="Fetching more reviews..."
        />
        <a v-else class="space-x-1" @click="onLoadMoreReviews">
          <span>
            <i class="fa-solid fa-arrow-down"></i>
          </span>
          <span>Load more</span>
        </a>
      </li>
    </TransitionList>
  </div>
</template>

<script setup lang="ts">
import {
  ApiList,
  ListOperatorReviewsParams,
  OperatorDTO,
  OperatorReviewDTO,
  OperatorReviewSortBy,
  SortOrder,
  VerificationStatus,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { parsePhoneNumber } from 'libphonenumber-js';
import { computed, onMounted, reactive, watch } from 'vue';

import { useClient } from '../../api-client';
import { DefaultProfile, SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import DrawerPanel from '../common/drawer-panel.vue';
import EditOperatorReview from '../common/edit-operator-review.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormSelect from '../common/form-select.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import NavLink from '../common/nav-link.vue';
import PillLabel from '../common/pill-label.vue';
import StarRating from '../common/star-rating.vue';
import TextHeading from '../common/text-heading.vue';
import TransitionList from '../common/transition-list.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import OperatorReviewsListItem from './operator-reviews-list-item.vue';

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const toasts = useToasts();

interface ViewOperatorProps {
  operator: OperatorDTO;
}

interface ViewOperatorState {
  canSubmitReview: boolean;
  currentReview?: OperatorReviewDTO;
  isLoadingMore: boolean;
  isLoadingReviews: boolean;
  isSavingReview: boolean;
  reviews: ApiList<OperatorReviewDTO>;
  showConfirmDeleteReview: boolean;
  showEditReview: boolean;
  sortOrder: string;
}

const SortOptions: SelectOption[] = [
  {
    label: 'Age (most recent to oldest)',
    value: `${OperatorReviewSortBy.Age}-${SortOrder.Descending}`,
  },
  {
    label: 'Age (most recent to oldest)',
    value: `${OperatorReviewSortBy.Age}-${SortOrder.Ascending}`,
  },
  {
    label: 'Rating (highest to lowest)',
    value: `${OperatorReviewSortBy.Rating}-${SortOrder.Descending}`,
  },
  {
    label: 'Rating (lowest to highest)',
    value: `${OperatorReviewSortBy.Rating}-${SortOrder.Ascending}`,
  },
];

const DefaultReview: OperatorReviewDTO = {
  createdAt: Date.now(),
  id: '',
  creator: currentUser.user?.profile ?? DefaultProfile,
  rating: 0,
  updatedAt: Date.now(),
};

const props = defineProps<ViewOperatorProps>();
const state = reactive<ViewOperatorState>({
  canSubmitReview: false,
  isLoadingReviews: true,
  isLoadingMore: false,
  isSavingReview: false,
  reviews: {
    data: [],
    totalCount: 0,
  },
  showConfirmDeleteReview: false,
  showEditReview: false,
  sortOrder: `${OperatorReviewSortBy.Age}-${SortOrder.Descending}`,
});

const phoneUri = computed(() =>
  props.operator.phone
    ? parsePhoneNumber(props.operator.phone, 'US').getURI()
    : '',
);
const formattedPhone = computed(() =>
  props.operator.phone
    ? parsePhoneNumber(props.operator.phone, 'US').formatInternational()
    : '',
);
const showSocials = computed(
  () =>
    props.operator.socials?.facebook ||
    props.operator.socials?.instagram ||
    props.operator.socials?.tiktok ||
    props.operator.socials?.twitter ||
    props.operator.socials?.youtube,
);

function onSubmitReview(): void {
  state.currentReview = { ...DefaultReview };
  state.showEditReview = true;
}

function onEditReview(review: OperatorReviewDTO): void {
  state.currentReview = review;
  state.showEditReview = true;
}

function onCancelEditReview(): void {
  state.showEditReview = false;
}

async function onConfirmEditReview(review: OperatorReviewDTO): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (review.id) {
      const updated = await client.operatorReviews.updateReview(
        props.operator.slug,
        review.id,
        review,
      );

      const index = state.reviews.data.findIndex((r) => r.id === review.id);
      if (index > -1) {
        state.reviews.data.splice(index, 1, updated);
      }

      toasts.success('review-updated', 'Your review has been updated!');
    } else {
      const newReview = await client.operatorReviews.createReview(
        props.operator.slug,
        review,
      );

      state.reviews.data.splice(0, 0, newReview);
      state.reviews.totalCount++;

      toasts.success(
        'review-submitted',
        'Your review has been added! Thank you!',
      );

      await canSubmitReview();
    }

    state.showEditReview = false;
  });

  state.isSavingReview = false;
}

function onDeleteReview(review: OperatorReviewDTO): void {
  state.currentReview = review;
  state.showConfirmDeleteReview = true;
}

function onCancelDeleteReview(): void {
  state.showConfirmDeleteReview = false;
}

async function onConfirmDeleteReview(): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (!state.currentReview) return;

    await client.operatorReviews.deleteReview(
      props.operator.slug,
      state.currentReview.id,
    );

    const index = state.reviews.data.findIndex(
      (r) => r.id === state.currentReview?.id,
    );
    if (index > -1) {
      state.reviews.data.splice(index, 1);
      state.reviews.totalCount--;
    }

    toasts.success(
      'review-deleted',
      'Your review has been deleted successfully.',
    );

    await canSubmitReview();

    state.showConfirmDeleteReview = false;
  });

  state.isSavingReview = false;
}

function getListReviewsParams(skip?: number): ListOperatorReviewsParams {
  const [sortBy, sortOrder] = state.sortOrder.split('-') as [
    OperatorReviewSortBy,
    SortOrder,
  ];

  return {
    skip,
    sortBy,
    sortOrder,
  };
}

async function canSubmitReview(): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) {
      state.canSubmitReview = false;
      return;
    }

    const { data } = await client.operatorReviews.listReviews(
      props.operator.slug,
      {
        creator: currentUser.user.username,
        limit: 1,
        sortBy: OperatorReviewSortBy.Age,
        sortOrder: SortOrder.Descending,
      },
    );

    const lastSubmission = data[0]?.updatedAt ?? data[0]?.createdAt ?? 0;
    const twentyFourHoursAgo = Date.now() - 1000 * 60 * 60 * 48;
    state.canSubmitReview = twentyFourHoursAgo >= lastSubmission;
  });
}

async function refreshReviews(): Promise<void> {
  state.isLoadingReviews = true;

  await oops(async () => {
    state.reviews = await client.operatorReviews.listReviews(
      props.operator.slug,
      getListReviewsParams(),
    );
  });

  state.isLoadingReviews = false;
}

async function onLoadMoreReviews() {
  state.isLoadingMore = true;

  await oops(async () => {
    const newReviews = await client.operatorReviews.listReviews(
      props.operator.slug,
      getListReviewsParams(state.reviews.data.length),
    );

    state.reviews.data.push(...newReviews.data);
    state.reviews.totalCount = newReviews.totalCount;
  });

  state.isLoadingMore = false;
}

onMounted(async () => {
  await Promise.all([refreshReviews(), canSubmitReview()]);
});

watch(() => state.sortOrder, refreshReviews);
</script>
