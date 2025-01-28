<template>
  <DrawerPanel
    title="Select Dive Site"
    :visible="state.showSelectDiveSite"
    @close="onCloseDiveSitePanel"
  >
    <SelectSite
      :current-site="formData.site"
      :current-operator="formData.operator"
      @site-selected="onSiteSelected"
    />
  </DrawerPanel>

  <DrawerPanel
    title="Select Dive Shop"
    :visible="state.showSelectOperator"
    @close="onCloseOperatorPanel"
  >
    <SelectOperator
      :current-operator="formData.operator"
      @operator-selected="onOperatorSelected"
    />
  </DrawerPanel>

  <DrawerPanel
    title="Review Dive Shop"
    :visible="state.showReviewOperator"
    @close="onCancelReviewOperator"
  >
    <EditOperatorReview
      v-if="state.operatorReview"
      :review="state.operatorReview"
      :is-saving="state.isSavingReview"
      @save="onConfirmReviewOperator"
      @cancel="onCancelReviewOperator"
    />
    <div v-else class="text-center text-lg">
      <LoadingSpinner message="Fetching review data..." />
    </div>
  </DrawerPanel>

  <DrawerPanel
    title="Review Dive Site"
    :visible="state.showReviewSite"
    @close="onCancelReviewSite"
  >
    <EditDiveSiteReview
      v-if="state.siteReview"
      :review="state.siteReview"
      :is-saving="state.isSavingReview"
      @save="onConfirmReviewSite"
      @cancel="onCancelReviewSite"
    />
    <div v-else class="text-center text-lg">
      <LoadingSpinner message="Fetching review data..." />
    </div>
  </DrawerPanel>

  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700 to-blue-500 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Location</TextHeading>

    <div class="space-y-2">
      <TextHeading level="h3">Dive Shop</TextHeading>
      <div v-if="formData.operator" class="space-y-2 ml-4">
        <PreviewOperator :operator="formData.operator" />
        <div class="flex justify-center items-baseline">
          <FormButton
            size="xs"
            test-id="btn-change-shop"
            rounded="left"
            @click="onOpenOperatorPanel"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-solid fa-pen"></i>
              </span>
              <span>Change shop</span>
            </p>
          </FormButton>
          <FormButton
            size="xs"
            :rounded="false"
            test-id="btn-remove-shop"
            @click="onRemoveOperator"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-solid fa-x"></i>
              </span>
              <span>Remove shop</span>
            </p>
          </FormButton>
          <FormButton
            size="xs"
            rounded="right"
            test-id="btn-review-shop"
            @click="onReviewOperator"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-regular fa-star"></i>
              </span>
              <span>Review dive shop</span>
            </p>
          </FormButton>
          <div
            v-if="state.operatorReview"
            class="ml-3 flex gap-1 items-baseline"
          >
            <span class="font-bold">Your rating:</span>
            <StarRating :model-value="state.operatorReview.rating" readonly />
          </div>
        </div>
      </div>

      <div v-else class="flex gap-3 items-center ml-4">
        <FormButton
          class="min-w-36"
          test-id="btn-select-operator"
          @click="onOpenOperatorPanel"
        >
          Select Dive Shop...
        </FormButton>
        <p class="text-lg">
          Were you diving with a dive shop? (E.g. on a chartered boat?)
        </p>
      </div>
    </div>

    <div class="space-y-2">
      <TextHeading level="h3">Dive Site</TextHeading>
      <div v-if="state.isLoadingSite">
        <LoadingSpinner message="Fetching dive site..." />
      </div>

      <div v-else-if="formData.site" class="space-y-2 ml-4">
        <PreviewDiveSite :site="formData.site" />
        <div class="flex justify-center items-baseline">
          <FormButton
            size="xs"
            rounded="left"
            test-id="btn-change-site"
            @click="onOpenDiveSitePanel"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-solid fa-pen"></i>
              </span>
              <span>Change site</span>
            </p>
          </FormButton>
          <FormButton
            size="xs"
            :rounded="false"
            test-id="btn-remove-site"
            @click="onRemoveSite"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-solid fa-x"></i>
              </span>
              <span>Remove site</span>
            </p>
          </FormButton>
          <FormButton
            size="xs"
            rounded="right"
            test-id="btn-review-site"
            @click="onReviewSite"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-regular fa-star"></i>
              </span>
              <span>Review dive site</span>
            </p>
          </FormButton>
          <div v-if="state.siteReview" class="ml-3 flex gap-1 items-baseline">
            <span class="font-bold">Your rating:</span>
            <StarRating :model-value="state.siteReview.rating" readonly />
          </div>
        </div>
      </div>

      <div v-else class="flex gap-3 items-center ml-4">
        <FormButton
          class="min-w-36"
          test-id="btn-select-site"
          @click="onOpenDiveSitePanel"
        >
          Select Dive Site...
        </FormButton>
        <p class="text-lg">
          Where did you dive? Pick out the dive site! Or if it's not in our
          database, you can add it so that you and other users can log dives
          there in the future!
        </p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import {
  DiveSiteDTO,
  DiveSiteReviewDTO,
  OperatorDTO,
  OperatorReviewDTO,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { DefaultProfile } from '../../../common';
import { useOops } from '../../../oops';
import { useCurrentUser, useToasts } from '../../../store';
import DrawerPanel from '../../common/drawer-panel.vue';
import EditDiveSiteReview from '../../common/edit-dive-site-review.vue';
import EditOperatorReview from '../../common/edit-operator-review.vue';
import FormButton from '../../common/form-button.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import StarRating from '../../common/star-rating.vue';
import TextHeading from '../../common/text-heading.vue';
import PreviewDiveSite from '../../diveSites/preview-dive-site.vue';
import SelectSite from '../../diveSites/selectSite/select-site.vue';
import PreviewOperator from '../../operators/preview-operator.vue';
import SelectOperator from '../../operators/selectOperator/select-operator.vue';
import { LogEntryLocation } from './types';

interface EditDiveLocationProps {
  entryId: string;
}

interface EditDiveLocationState {
  isLoadingSite: boolean;
  isSavingReview: boolean;
  operatorReview?: OperatorReviewDTO;
  siteReview?: DiveSiteReviewDTO;
  showReviewOperator: boolean;
  showReviewSite: boolean;
  showSelectDiveSite: boolean;
  showSelectOperator: boolean;
}

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const toasts = useToasts();

const DefaultOperatorReview: OperatorReviewDTO = {
  createdAt: Date.now(),
  creator: currentUser.user?.profile ?? DefaultProfile,
  id: '',
  rating: 0,
  updatedAt: Date.now(),
};

const DefaultSiteReview: DiveSiteReviewDTO = {
  createdOn: Date.now(),
  creator: currentUser.user?.profile ?? DefaultProfile,
  id: '',
  rating: 0,
};

const props = defineProps<EditDiveLocationProps>();
const formData = defineModel<LogEntryLocation>({ required: true });
const state = reactive<EditDiveLocationState>({
  isLoadingSite: false,
  isSavingReview: false,
  showReviewOperator: false,
  showReviewSite: false,
  showSelectDiveSite: false,
  showSelectOperator: false,
});

function onCloseDiveSitePanel() {
  state.showSelectDiveSite = false;
}

function onOpenDiveSitePanel() {
  state.showSelectDiveSite = true;
}

function onCloseOperatorPanel() {
  state.showSelectOperator = false;
}

function onOpenOperatorPanel() {
  state.showSelectOperator = true;
}

function onSiteSelected(site: DiveSiteDTO) {
  formData.value.site = site;
  state.showSelectDiveSite = false;
}

function onRemoveSite() {
  formData.value.site = undefined;
}

function onOperatorSelected(operator: OperatorDTO) {
  formData.value.operator = operator;
  state.showSelectOperator = false;
}

function onRemoveOperator() {
  formData.value.operator = undefined;
}

function onReviewOperator() {
  state.showReviewOperator = true;
}

function onCancelReviewOperator() {
  state.showReviewOperator = false;
}

async function onConfirmReviewOperator(
  review: OperatorReviewDTO,
): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (!currentUser.user) return;

    state.operatorReview = await client.logEntries.reviewOperator(
      currentUser.user.username,
      props.entryId,
      {
        rating: review.rating,
        comments: review.comments,
      },
    );

    toasts.success(
      'operator-review-submitted',
      'Dive shop review has been submitted! Thank you!',
    );

    state.showReviewOperator = false;
  });

  state.isSavingReview = false;
}

function onReviewSite() {
  state.showReviewSite = true;
}

function onCancelReviewSite() {
  state.showReviewSite = false;
}

async function onConfirmReviewSite(review: DiveSiteReviewDTO): Promise<void> {
  state.isSavingReview = true;

  await oops(async () => {
    if (!currentUser.user) return;

    state.siteReview = await client.logEntries.reviewSite(
      currentUser.user.username,
      props.entryId,
      {
        rating: review.rating,
        difficulty: review.difficulty,
        comments: review.comments,
      },
    );

    toasts.success(
      'site-review-submitted',
      'Dive site review has been submitted! Thank you!',
    );

    state.showReviewSite = false;
  });

  state.isSavingReview = false;
}

onMounted(async () => {
  await Promise.any([
    oops(
      async () => {
        if (!currentUser.user) return;
        state.operatorReview = await client.logEntries.getOperatorReview(
          currentUser.user.username,
          props.entryId,
        );
      },
      {
        [404]: () => {
          state.operatorReview = DefaultOperatorReview;
        },
      },
    ),
    oops(
      async () => {
        if (!currentUser.user) return;
        state.siteReview = await client.logEntries.getSiteReview(
          currentUser.user.username,
          props.entryId,
        );
      },
      {
        [404]: () => {
          state.siteReview = DefaultSiteReview;
        },
      },
    ),
  ]);

  if (!state.operatorReview) {
    state.operatorReview = DefaultOperatorReview;
  }

  if (!state.siteReview) {
    state.siteReview = DefaultSiteReview;
  }
});
</script>
