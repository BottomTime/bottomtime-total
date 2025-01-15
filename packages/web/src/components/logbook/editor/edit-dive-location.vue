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

  <section class="border-2 border-secondary p-2 rounded-md space-y-3 px-6">
    <TextHeading class="-ml-3" level="h2">Location</TextHeading>

    <FormField label="Dive Shop">
      <div v-if="formData.operator" class="space-y-2">
        <PreviewOperator :operator="formData.operator" />
        <div class="flex gap-3 justify-center">
          <FormButton
            size="xs"
            test-id="btn-change-shop"
            @click="onOpenOperatorPanel"
          >
            Change dive shop...
          </FormButton>
          <FormButton
            size="xs"
            test-id="btn-remove-shop"
            @click="onRemoveOperator"
          >
            Remove dive shop
          </FormButton>
        </div>
      </div>

      <div v-else class="flex gap-3 items-center">
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
    </FormField>

    <FormField label="Dive Site">
      <div v-if="state.isLoadingSite">
        <LoadingSpinner message="Fetching dive site..." />
      </div>

      <div v-else-if="formData.site" class="space-y-2">
        <PreviewDiveSite :site="formData.site" />
        <div class="flex gap-3 justify-center">
          <FormButton
            size="xs"
            test-id="btn-change-site"
            @click="onOpenDiveSitePanel"
          >
            Change site...
          </FormButton>
          <FormButton size="xs" test-id="btn-remove-site" @click="onRemoveSite">
            Remove site
          </FormButton>
        </div>
      </div>

      <div v-else class="flex gap-3 items-center">
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
    </FormField>
  </section>
</template>

<script lang="ts" setup>
import { DiveSiteDTO, OperatorDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import DrawerPanel from '../../common/drawer-panel.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import TextHeading from '../../common/text-heading.vue';
import PreviewDiveSite from '../../diveSites/preview-dive-site.vue';
import SelectSite from '../../diveSites/selectSite/select-site.vue';
import PreviewOperator from '../../operators/preview-operator.vue';
import SelectOperator from '../../operators/selectOperator/select-operator.vue';
import { LogEntryLocation } from './types';

interface EditDiveLocationState {
  isLoadingSite: boolean;
  showSelectDiveSite: boolean;
  showSelectOperator: boolean;
}

const formData = defineModel<LogEntryLocation>({ required: true });
const state = reactive<EditDiveLocationState>({
  isLoadingSite: false,
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
</script>
