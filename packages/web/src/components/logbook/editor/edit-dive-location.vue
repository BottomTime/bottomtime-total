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
      :review="formData.operatorReview"
      @save="onConfirmReviewOperator"
      @cancel="onCancelReviewOperator"
    />
  </DrawerPanel>

  <DrawerPanel
    title="Review Dive Site"
    :visible="state.showReviewSite"
    @close="onCancelReviewSite"
  >
    <EditDiveSiteReview
      :review="formData.siteReview"
      @save="onConfirmReviewSite"
      @cancel="onCancelReviewSite"
    />
  </DrawerPanel>

  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700/40 to-blue-500/40 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Location</TextHeading>

    <div class="space-y-2">
      <TextHeading level="h3">Dive Shop</TextHeading>
      <div v-if="formData.operator" class="flex flex-col gap-2 ml-4">
        <PreviewOperator :operator="formData.operator" />
        <div class="flex flex-col gap-1 xl:flex-row justify-between">
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
          </div>
          <div
            v-if="formData.operatorReview"
            class="flex flex-row gap-1 justify-center items-baseline text-sm"
          >
            <span class="font-bold">Your rating:</span>
            <StarRating
              :model-value="formData.operatorReview.rating"
              readonly
            />
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

      <div v-if="formData.site" class="space-y-2 ml-4">
        <PreviewDiveSite :site="formData.site" />
        <div class="flex flex-col gap-1 xl:flex-row justify-between">
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
          </div>
          <div
            v-if="formData.siteReview"
            class="flex flex-row gap-1 justify-center items-baseline text-sm"
          >
            <span class="font-bold">Your rating:</span>
            <StarRating :model-value="formData.siteReview.rating" readonly />
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
          Where did you dive? Pick out the dive site! Or, if it's not in our
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

import { reactive } from 'vue';

import DrawerPanel from '../../common/drawer-panel.vue';
import FormButton from '../../common/form-button.vue';
import StarRating from '../../common/star-rating.vue';
import TextHeading from '../../common/text-heading.vue';
import EditDiveSiteReview from '../../diveSites/edit-dive-site-review.vue';
import PreviewDiveSite from '../../diveSites/preview-dive-site.vue';
import SelectSite from '../../diveSites/selectSite/select-site.vue';
import EditOperatorReview from '../../operators/edit-operator-review.vue';
import PreviewOperator from '../../operators/preview-operator.vue';
import SelectOperator from '../../operators/selectOperator/select-operator.vue';
import { LogEntryLocation } from './types';

interface EditDiveLocationState {
  showReviewOperator: boolean;
  showReviewSite: boolean;
  showSelectDiveSite: boolean;
  showSelectOperator: boolean;
}

const formData = defineModel<LogEntryLocation>({ required: true });
const state = reactive<EditDiveLocationState>({
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

function onConfirmReviewOperator(review: OperatorReviewDTO) {
  formData.value.operatorReview = review;
  state.showReviewOperator = false;
}

function onReviewSite() {
  state.showReviewSite = true;
}

function onCancelReviewSite() {
  state.showReviewSite = false;
}

function onConfirmReviewSite(review: DiveSiteReviewDTO) {
  formData.value.siteReview = review;
  state.showReviewSite = false;
}
</script>
