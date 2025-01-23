<template>
  <ConfirmDialog
    title="Request Verfication?"
    confirm-text="Request Verification"
    icon="fa-solid fa-circle-question"
    :is-loading="state.isUpdatingVerification"
    :visible="state.showConfirmRequestVerificationDialog"
    size="md"
    @confirm="onConfirmRequestVerification"
    @cancel="onCancelRequestVerification"
  >
    <p>
      Are you ready to request verification for your dive shop? Your information
      will be reviewed and, once the information provided is determined to be
      valid and factual, your dive shop will be marked as verified.
    </p>

    <p>Some things you should keep in mind before confirming your request:</p>

    <ul class="px-4 list-outside list-disc">
      <li>The verification process may take several days.</li>
      <li>
        All of the information provided will be verified. Errors in the
        information or details that cannot be verified may cause delays.
      </li>
      <li>
        Changing your details after verification (e.g. changing your dive shop's
        name) may cause the changes to be verified again.
        <span class="italic">
          Your verification status will not be affected during this period but
          you may be contacted again to verify the changes.
        </span>
      </li>
    </ul>

    <p>
      Have you double-checked all of the information provided? If so, click
      <span class="font-bold">Request Verification</span> to proceed.
    </p>
  </ConfirmDialog>

  <ConfirmDialog
    :visible="state.showConfirmVerifyDialog"
    title="Verify Dive Shop Details?"
    confirm-text="Verify"
    icon="fa-regular fa-circle-question"
    size="md"
    :is-loading="state.isUpdatingVerification"
    @confirm="onConfirmVerify"
    @cancel="onCancelVerify"
  >
    <p>
      Do you certify that the dive shop details displayed on this page have been
      verified to be accurate and up-to-date?
    </p>

    <p>If so, click <span class="font-bold">Verify</span> to confirm.</p>
  </ConfirmDialog>

  <ConfirmRejectVerificationDialog
    :is-saving="state.isUpdatingVerification"
    :visible="state.showConfirmRejectDialog"
    @confirm="onConfirmRejectVerification"
    @cancel="onCancelRejectVerification"
  />

  <VerificationBadge
    v-if="operator?.id"
    class="mb-8"
    :status="operator?.verificationStatus"
    :message="operator?.verificationMessage"
    :is-saving="state.isUpdatingVerification"
    @request-verification="onRequestVerification"
    @verify="onVerify"
    @reject="onRejectVerification"
  />

  <TabsPanel
    :tabs="tabs"
    :active-tab="state.activeTab"
    @tab-changed="onTabChanged"
  >
    <EditOperatorInfo
      v-if="state.activeTab === TabKey.ShopInfo && operator"
      :operator="operator"
      :is-saving="isSaving"
      @delete="(operator) => emit('delete', operator)"
      @save="(data) => emit('save', data)"
    />

    <EditOperatorSites
      v-else-if="state.activeTab === TabKey.DiveSites && operator"
      :operator="operator"
    />
  </TabsPanel>
</template>

<script lang="ts" setup>
import { CreateOrUpdateOperatorDTO, OperatorDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useClient } from '../../api-client';
import { TabInfo, ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import TabsPanel from '../common/tabs-panel.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import ConfirmRejectVerificationDialog from './confirm-reject-verification-dialog.vue';
import EditOperatorInfo from './editor/edit-operator-info.vue';
import EditOperatorSites from './editor/edit-operator-sites.vue';
import VerificationBadge from './verification-badge.vue';

enum TabKey {
  ShopInfo = 'shopInfo',
  DiveSites = 'diveSites',
  TeamMembers = 'teamMembers',
}

interface EditOperatorProps {
  isSaving?: boolean;
  operator?: OperatorDTO;
}

interface EditOperatorState {
  activeTab: TabKey;
  isUpdatingVerification: boolean;
  showConfirmRequestVerificationDialog: boolean;
  showConfirmVerifyDialog: boolean;
  showConfirmRejectDialog: boolean;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const tabs = computed<TabInfo[]>(() => [
  {
    key: TabKey.ShopInfo,
    label: 'Shop Info',
  },
  {
    key: TabKey.DiveSites,
    label: 'Dive Sites',
    visible: !!props.operator?.id,
  },
  {
    key: TabKey.TeamMembers,
    label: 'Team Members',
    visible: !!props.operator?.id,
  },
]);

const props = withDefaults(defineProps<EditOperatorProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save', data: CreateOrUpdateOperatorDTO): void;
  (e: 'delete', operator: OperatorDTO): void;
  (e: 'logo-changed', logo: string | undefined): void;
  (e: 'verification-requested', operator: OperatorDTO): void;
  (e: 'verified', message?: string): void;
  (e: 'rejected', message?: string): void;
}>();
const state = reactive<EditOperatorState>({
  activeTab: TabKey.ShopInfo,
  isUpdatingVerification: false,
  showConfirmRequestVerificationDialog: false,
  showConfirmRejectDialog: false,
  showConfirmVerifyDialog: false,
});

function onRequestVerification() {
  state.showConfirmRequestVerificationDialog = true;
}

async function onConfirmRequestVerification() {
  state.isUpdatingVerification = true;

  await oops(async () => {
    if (!props.operator) return;

    await client.operators.requestVerification(props.operator);

    emit('verification-requested', props.operator);
    state.showConfirmRequestVerificationDialog = false;
  });

  state.isUpdatingVerification = false;
}

function onCancelRequestVerification() {
  state.showConfirmRequestVerificationDialog = false;
}

function onVerify() {
  state.showConfirmVerifyDialog = true;
}

async function onConfirmVerify(): Promise<void> {
  state.isUpdatingVerification = true;

  await oops(async () => {
    if (!props.operator) return;

    await client.operators.setVerified(props.operator, true);
    state.showConfirmVerifyDialog = false;
    emit('verified');

    toasts.toast({
      id: 'verification',
      message: 'Verification request has been approved',
      type: ToastType.Success,
    });
  });

  state.isUpdatingVerification = false;
}

function onCancelVerify() {
  state.showConfirmVerifyDialog = false;
}

function onRejectVerification() {
  state.showConfirmRejectDialog = true;
}

async function onConfirmRejectVerification(message?: string): Promise<void> {
  state.isUpdatingVerification = true;

  await oops(async () => {
    if (!props.operator) return;

    await client.operators.setVerified(props.operator, false, message);
    state.showConfirmRejectDialog = false;
    emit('rejected', message);

    toasts.toast({
      id: 'verification',
      message: 'Verification request has been rejected',
      type: ToastType.Success,
    });
  });

  state.isUpdatingVerification = false;
}

function onCancelRejectVerification() {
  state.showConfirmRejectDialog = false;
}

function onTabChanged(key: string) {
  state.activeTab = key as TabKey;
}
</script>
