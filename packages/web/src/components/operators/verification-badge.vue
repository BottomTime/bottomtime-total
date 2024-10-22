<template>
  <ConfirmDialog
    :visible="state.showConfirmVerify"
    title="Verify Dive Shop Details?"
    confirm-text="Verify"
    size="md"
    :is-loading="state.isSaving"
    @confirm="onConfirmVerify"
    @cancel="onCancelVerify"
  >
    <div class="flex gap-3">
      <p class="text-4xl">
        <i class="fa-regular fa-circle-question"></i>
      </p>
      <div class="space-y-3">
        <p>
          Do you certify that the dive shop details displayed on this page have
          been verified to be accurate and up-to-date?
        </p>

        <p>If so, click <span class="font-bold">Verify</span> to confirm.</p>
      </div>
    </div>
  </ConfirmDialog>

  <ConfirmRejectVerificationDialog
    :is-saving="state.isSaving"
    :visible="state.showConfirmReject"
    @confirm="onConfirmReject"
    @cancel="onCancelReject"
  />

  <div v-if="isAdmin" class="mx-auto w-fit">
    <FormBox class="space-y-3">
      <TextHeading level="h3">Verification Status</TextHeading>
      <div class="flex items-center gap-8">
        <div class="flex items-baseline gap-2">
          <span v-if="status === Statuses.Verified" class="text-success">
            <i class="fa-solid fa-check"></i>
          </span>
          <span v-else-if="status === Statuses.Unverified" class="text-warn">
            <i class="fa-solid fa-circle-exclamation"></i>
          </span>
          <span v-else-if="status === Statuses.Rejected" class="text-danger">
            <i class="fa-regular fa-circle-xmark"></i>
          </span>
          <span v-else class="text-secondary">
            <i class="fa-regular fa-clock"></i>
          </span>

          <span class="font-bold text-lg capitalize">{{ status }}</span>
          <span v-if="message" class="text-sm italic">"{{ message }}"</span>
        </div>

        <div class="flex items-center">
          <FormButton
            v-if="status !== Statuses.Verified"
            :rounded="status === Statuses.Rejected ? true : 'left'"
            @click="onVerify"
          >
            <p>
              <span>
                <i class="fa-solid fa-check"></i>
              </span>
              <span class="sr-only">Mark as verified</span>
            </p>
          </FormButton>
          <FormButton
            v-if="status !== Statuses.Rejected"
            :rounded="status === Statuses.Verified ? true : 'right'"
            type="danger"
            @click="onReject"
          >
            <p>
              <span>
                <i class="fa-solid fa-x"></i>
              </span>
              <span class="sr-only">Mark as unverified</span>
            </p>
          </FormButton>
        </div>
      </div>
    </FormBox>
  </div>

  <template v-else-if="status">
    <PillLabel
      v-if="status === Statuses.Verified"
      type="success"
      class="text-xl"
      data-testid="operator-verified"
    >
      <span>
        <i class="fa-solid fa-check"></i>
      </span>
      <span>Verified!</span>
    </PillLabel>

    <div
      v-else-if="status === Statuses.Unverified"
      class="flex gap-4 justify-center items-center text-sm text-warn px-6"
      data-testid="operator-unverified"
    >
      <span class="text-2xl">
        <i class="fa-solid fa-circle-exclamation"></i>
      </span>
      <span>
        Your dive shop is not yet verified. Verifying your dive shop will
        indicate to your customers that your shop is legitimate and can be
        trusted. Once you have your shop details filled out correctly you can
        request verification. We will review your details and contact you to
        verify your shop.
      </span>
      <FormButton
        class="text-nowrap"
        control-id="btn-request-verification"
        test-id="btn-request-verification"
        @click="$emit('request-verification')"
      >
        Request verfication...
      </FormButton>
    </div>

    <div
      v-else-if="status === Statuses.Rejected"
      class="flex gap-4 justify-center items-center text-sm text-danger px-6"
      data-testid="operator-verification-rejected"
    >
      <span class="text-2xl">
        <i class="fa-solid fa-circle-exclamation"></i>
      </span>
      <p class="space-y-3">
        <span>
          Your request for verification was reviewed but was rejected. Please
          address any outstanding issues and then request verification again.
        </span>
        <span
          v-if="message"
          class="font-bold"
          data-testid="verification-rejection-message"
          >{{ message }}</span
        >
      </p>
      <FormButton
        class="text-nowrap"
        control-id="btn-request-verification"
        test-id="btn-request-verification"
        @click="$emit('request-verification')"
      >
        Request verfication...
      </FormButton>
    </div>

    <div
      v-else
      class="flex gap-4 justify-center items-center text-sm text-secondary px-6"
      data-testid="operator-verification-pending"
    >
      <span class="text-2xl">
        <i class="fa-regular fa-clock"></i>
      </span>
      <span>
        Your request for verification has been received and is pending review.
        Please be patient; this may take several days.
      </span>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { UserRole, VerificationStatus } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import PillLabel from '../common/pill-label.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import ConfirmRejectVerificationDialog from './confirm-reject-verification-dialog.vue';

const Statuses = VerificationStatus;

interface VerificationStatusProps {
  isSaving?: boolean;
  message?: string;
  status?: VerificationStatus;
}

interface VerificationStatusState {
  isSaving: boolean;
  showConfirmVerify: boolean;
  showConfirmReject: boolean;
}

const currentUser = useCurrentUser();

withDefaults(defineProps<VerificationStatusProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'request-verification'): void;
  (e: 'verify', message?: string): void;
  (e: 'reject', message?: string): void;
}>();

const isAdmin = computed(() => currentUser.user?.role === UserRole.Admin);

const state = reactive<VerificationStatusState>({
  isSaving: false,
  showConfirmVerify: false,
  showConfirmReject: false,
});

function onVerify() {
  state.showConfirmVerify = true;
}

async function onConfirmVerify() {
  state.isSaving = true;

  state.isSaving = false;
  emit('verify');
}

function onCancelVerify() {
  state.showConfirmVerify = false;
}

function onReject() {
  state.showConfirmReject = true;
}

async function onConfirmReject(message?: string): Promise<void> {
  state.isSaving = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  state.showConfirmReject = false;
  state.isSaving = false;
  emit('reject', message);
}

function onCancelReject() {
  state.showConfirmReject = false;
}
</script>
