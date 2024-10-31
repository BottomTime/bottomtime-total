<template>
  <AddressDialog
    ref="addressDialog"
    :visible="state.showAddressDialog"
    :address="formData.address"
    :gps="formData.gps"
    @save="onConfirmChangeAddress"
    @cancel="onCancelChangeAddress"
  />

  <ConfirmDialog
    title="Change URL Shortcut?"
    confirm-text="Save Changes"
    icon="fa-regular fa-circle-question fa-2x"
    :is-loading="isSaving"
    :visible="state.showConfirmChangeSlugDialog"
    size="md"
    dangerous
    @confirm="onConfirmSave"
    @cancel="onCancelSave"
  >
    <div class="text-center">
      <p>
        You are about to change your dive shop's URL shortcut. This change will
        take effect immediately and the old URL will no longer work. Users who
        have bookmarked your dive shop's page will need to update their
        bookmarks.
      </p>

      <div
        class="border border-secondary-hover rounded-md py-4 bg-grey-400 dark:bg-grey-600"
      >
        <p class="font-bold underline text-lg">
          {{ oldShopUrl }}
        </p>
        <p>
          <i class="fa-solid fa-arrow-down"></i>
        </p>
        <p class="font-bold underline text-lg">
          {{ newShopUrl }}
        </p>
      </div>

      <p>Are you sure you want to proceed?</p>
    </div>
  </ConfirmDialog>

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

  <UploadImageDialog
    :avatar-url="state.logo"
    :is-saving="state.isSavingLogo"
    :visible="state.showChangeLogoDialog"
    @save="onSaveLogo"
    @cancel="onCancelChangeLogo"
  />

  <ConfirmDialog
    title="Remove Shop Logo?"
    icon="fa-regular fa-trash-can fa-2x"
    confirm-text="Remove Logo"
    :visible="state.showDeleteLogoDialog"
    dangerous
    @confirm="onConfirmDeleteLogo"
    @cancel="onCancelDeleteLogo"
  >
    <p>
      Are you sure you want to delete your dive shop's logo? After performing
      this action, it will appear in searches with a default logo.
    </p>
  </ConfirmDialog>

  <form @submit.prevent="onSave">
    <fieldset :disabled="isSaving" class="space-y-6">
      <VerificationBadge
        v-if="operator?.id"
        :status="operator?.verificationStatus"
        :message="operator?.verificationMessage"
        :is-saving="state.isUpdatingVerification"
        @request-verification="onRequestVerification"
        @verify="onVerify"
        @reject="onRejectVerification"
      />

      <article class="flex gap-4">
        <figure v-if="operator?.id" class="px-2 py-6">
          <!-- Manage Logo -->
          <div v-if="operator?.logo" class="flex flex-col gap-2 justify-center">
            <img :src="`${operator.logo}/256x256`" class="rounded-md" />
            <div class="flex justify-center">
              <FormButton
                class="text-nowrap"
                size="xs"
                rounded="left"
                test-id="btn-change-logo"
                @click="onChangeLogo"
              >
                <span class="sr-only">Change logo...</span>
                <span>
                  <i class="fa-solid fa-upload"></i>
                </span>
              </FormButton>
              <FormButton
                class="text-nowrap"
                size="xs"
                type="danger"
                rounded="right"
                test-id="btn-delete-logo"
                @click="onDeleteLogo"
              >
                <p>
                  <span class="sr-only">Remove logo</span>
                  <span>
                    <i class="fa-solid fa-trash"></i>
                  </span>
                </p>
              </FormButton>
            </div>
          </div>

          <!-- Upload New Logo -->
          <div v-else class="space-y-2 text-center">
            <div class="w-[128px] h-[128px]">
              <i class="fa-solid fa-image fa-8x"></i>
            </div>
            <FormButton
              class="text-nowrap"
              size="xs"
              test-id="btn-upload-logo"
              @click="onChangeLogo"
            >
              <p class="space-x-2">
                <span>
                  <i class="fa-solid fa-upload"></i>
                </span>
                <span>Upload logo...</span>
              </p>
            </FormButton>
          </div>
        </figure>

        <div class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10">
            <div>
              <TextHeading>Basic Info</TextHeading>

              <FormField
                label="Name"
                required
                control-id="operator-name"
                :error="v$.name.$errors[0]?.$message"
                :invalid="v$.name.$error"
                :responsive="false"
              >
                <FormTextBox
                  v-model.trim="formData.name"
                  control-id="operator-name"
                  test-id="name"
                  placeholder="Name of dive shop"
                  :maxlength="200"
                  :invalid="v$.name.$error"
                  :autofocus="true"
                />
              </FormField>

              <FormField
                label="URL Shortcut"
                required
                control-id="operator-slug"
                :error="v$.slug.$errors[0]?.$message"
                :invalid="v$.slug.$error"
                :responsive="false"
              >
                <div class="space-y-2">
                  <FormTextBox
                    v-model.trim="formData.slug"
                    control-id="operator-slug"
                    test-id="slug"
                    placeholder="my-dive-shop"
                    :maxlength="200"
                    :invalid="v$.slug.$error"
                    @change="state.autoUpdateSlug = false"
                  />
                  <p v-if="formData.slug" class="space-x-2 text-center">
                    <CopyButton tooltip-position="right" :value="newShopUrl" />
                    <span class="underline">
                      {{ newShopUrl }}
                    </span>
                  </p>

                  <p v-if="operator?.id" class="text-sm">
                    <span class="font-bold">NOTE: </span>
                    <span class="italic">
                      Avoid changing this unless you need to. Changing this
                      value will change the URL to your dive shop's page. Users'
                      bookmarks may be broken.
                    </span>
                  </p>
                  <p v-else class="text-sm italic">
                    This will be used to construct the URL to your dive shop.
                    The text may contain lower-case letters, numbers, as well as
                    URL-safe characters: - $ . + ! * ' ( )
                  </p>
                </div>
              </FormField>

              <FormField
                label="Description"
                required
                control-id="operator-description"
                :error="v$.description.$errors[0]?.$message"
                :invalid="v$.description.$error"
                :responsive="false"
              >
                <FormTextArea
                  v-model.trim="formData.description"
                  control-id="operator-description"
                  test-id="description"
                  :maxlength="2000"
                  :rows="5"
                  resize="none"
                  placeholder="Description of your dive shop and services offered"
                  :invalid="v$.description.$error"
                />
              </FormField>

              <FormField
                label="Active"
                required
                control-id="operator-active"
                :responsive="false"
              >
                <FormToggle
                  v-model="formData.active"
                  control-id="operator-active"
                  test-id="active"
                  :label="formData.active ? 'Active' : 'Inactive'"
                />
              </FormField>
            </div>

            <div>
              <TextHeading>Contact Info</TextHeading>

              <FormField
                label="Location"
                required
                :error="v$.address.$errors[0]?.$message"
                :invalid="v$.address.$error"
                :responsive="false"
                test-id="operator-location"
              >
                <div class="space-y-1.5 px-4">
                  <p v-if="formData.address">
                    <span data-testid="operator-address">
                      {{ formData.address }}
                    </span>
                  </p>

                  <p v-if="formData.gps" class="space-x-2">
                    <span class="text-danger">
                      <i class="fa-solid fa-location-dot"></i>
                    </span>
                    <span data-testid="operator-gps">
                      {{ formData.gps.lat }}, {{ formData.gps.lon }}
                    </span>
                  </p>

                  <FormButton
                    size="sm"
                    test-id="btn-operator-location"
                    @click="onChangeAddress"
                  >
                    {{ formData.address ? 'Change' : 'Set' }} Address...
                  </FormButton>
                </div>
              </FormField>

              <FormField
                label="Phone"
                required
                control-id="operator-phone"
                :error="v$.phone.$errors[0]?.$message"
                :invalid="v$.phone.$error"
                :responsive="false"
              >
                <FormTextBox
                  v-model.trim="formData.phone"
                  control-id="operator-phone"
                  test-id="phone"
                  :maxlength="50"
                  :invalid="v$.phone.$error"
                  placeholder="1 (555) 555-5555"
                />
              </FormField>

              <FormField
                label="Email"
                required
                control-id="operator-email"
                :error="v$.email.$errors[0]?.$message"
                :invalid="v$.email.$error"
                :responsive="false"
              >
                <FormTextBox
                  v-model.trim="formData.email"
                  control-id="operator-email"
                  test-id="email"
                  :maxlength="100"
                  :invalid="v$.email.$error"
                  placeholder="example@diveshop.com"
                />
              </FormField>

              <FormField
                label="Website"
                control-id="operator-website"
                :error="v$.website.$errors[0]?.$message"
                :invalid="v$.website.$error"
                :responsive="false"
              >
                <FormTextBox
                  v-model.trim="formData.website"
                  control-id="operator-website"
                  test-id="website"
                  :maxlength="200"
                  :invalid="v$.website.$error"
                  placeholder="https://www.example.com"
                />
              </FormField>
            </div>
          </div>
          <TextHeading>Social Media Accounts</TextHeading>

          <FormField
            :responsive="false"
            help="Include account names only. Do not write full URLs and do not include any @ symbols."
          >
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 m-1"
            >
              <div class="flex gap-1.5 items-baseline w-full">
                <p>
                  <span>
                    <i class="fab fa-facebook fa-fw"></i>
                  </span>
                  <label class="sr-only" for="operator-facebook">
                    Facebook
                  </label>
                </p>
                <FormTextBox
                  v-model.trim="formData.facebook"
                  class="w-full"
                  control-id="operator-facebook"
                  test-id="facebook"
                  :maxlength="100"
                />
              </div>

              <div class="flex gap-1.5 items-baseline w-full">
                <p>
                  <span>
                    <i class="fab fa-instagram fa-fw"></i>
                  </span>
                  <label class="sr-only" for="operator-instagram">
                    Instagram
                  </label>
                </p>
                <FormTextBox
                  v-model.trim="formData.instagram"
                  class="w-full"
                  control-id="operator-instagram"
                  test-id="instagram"
                  :maxlength="100"
                />
              </div>

              <div class="flex gap-1.5 items-baseline w-full">
                <p>
                  <span>
                    <i class="fab fa-tiktok fa-fw"></i>
                  </span>
                  <label class="sr-only" for="operator-tiktok">TikTok</label>
                </p>
                <FormTextBox
                  v-model.trim="formData.tiktok"
                  class="w-full"
                  control-id="operator-tiktok"
                  test-id="tiktok"
                  :maxlength="100"
                />
              </div>

              <div class="flex gap-1.5 items-baseline w-full">
                <p>
                  <span>
                    <i class="fa-brands fa-x-twitter fa-fw"></i>
                  </span>
                  <label class="sr-only" for="operator-twitter">
                    Twitter / X
                  </label>
                </p>
                <FormTextBox
                  v-model.trim="formData.twitter"
                  class="w-full"
                  control-id="operator-twitter"
                  test-id="twitter"
                  :maxlength="100"
                />
              </div>

              <div class="flex gap-1.5 items-baseline w-full">
                <p>
                  <span>
                    <i class="fab fa-youtube fa-fw"></i>
                  </span>
                  <label class="sr-only" for="operator-youtube">Youtube</label>
                </p>
                <FormTextBox
                  v-model.trim="formData.youtube"
                  class="w-full"
                  control-id="operator-youtube"
                  test-id="youtube"
                  :maxlength="100"
                />
              </div>
            </div>
          </FormField>
        </div>
      </article>

      <div class="flex justify-center gap-3">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          test-id="btn-save-operator"
          submit
          @click="onSave"
        >
          <p class="space-x-2">
            <span>
              <i class="fa-regular fa-floppy-disk"></i>
            </span>
            <span>
              {{ operator ? 'Save Changes' : 'Create Dive Shop' }}
            </span>
          </p>
        </FormButton>

        <FormButton
          v-if="operator?.id"
          type="danger"
          test-id="btn-delete-operator"
          @click="$emit('delete', operator)"
        >
          <p class="space-x-2">
            <span>
              <i class="fa-solid fa-trash"></i>
            </span>
            <span>Delete</span>
          </p>
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import {
  CreateOrUpdateOperatorDTO,
  GPSCoordinates,
  GpsCoordinates,
  OperatorDTO,
  SlugRegex,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required, url } from '@vuelidate/validators';

import slugify from 'slugify';
import { URL } from 'url';
import { computed, reactive, ref, watch } from 'vue';

import { useClient } from '../../api-client';
import { Coordinates, ToastType } from '../../common';
import { Config } from '../../config';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import { phone } from '../../validators';
import CopyButton from '../common/copy-button.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import FormToggle from '../common/form-toggle.vue';
import TextHeading from '../common/text-heading.vue';
import AddressDialog from '../dialog/address-dialog.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import UploadImageDialog from '../dialog/upload-image-dialog.vue';
import ConfirmRejectVerificationDialog from './confirm-reject-verification-dialog.vue';
import VerificationBadge from './verification-badge.vue';

interface EditOperatorFormData {
  active: boolean;
  address: string;
  description: string;
  email: string;
  facebook: string;
  gps: GpsCoordinates | null;
  instagram: string;
  name: string;
  phone: string;
  slug: string;
  tiktok: string;
  twitter: string;
  website: string;
  youtube: string;
}

interface EditOperatorProps {
  isSaving?: boolean;
  operator?: OperatorDTO;
}

interface EditOperatorState {
  autoUpdateSlug: boolean;
  isSavingLogo: boolean;
  isUpdatingVerification: boolean;
  logo: string;
  showAddressDialog: boolean;
  showChangeLogoDialog: boolean;
  showConfirmChangeSlugDialog: boolean;
  showConfirmRequestVerificationDialog: boolean;
  showConfirmVerifyDialog: boolean;
  showConfirmRejectDialog: boolean;
  showDeleteLogoDialog: boolean;
}

function formDataFromDto(dto?: OperatorDTO): EditOperatorFormData {
  return {
    active: typeof dto?.active === 'boolean' ? dto.active : true,
    address: dto?.address || '',
    description: dto?.description || '',
    email: dto?.email || '',
    facebook: dto?.socials?.facebook || '',
    gps: dto?.gps ?? null,
    instagram: dto?.socials?.instagram || '',
    name: dto?.name || '',
    phone: dto?.phone || '',
    slug: dto?.slug || '',
    tiktok: dto?.socials?.tiktok || '',
    twitter: dto?.socials?.twitter || '',
    website: dto?.website || '',
    youtube: dto?.socials?.youtube || '',
  };
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const addressDialog = ref<InstanceType<typeof AddressDialog> | null>(null);

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
  autoUpdateSlug: !props.operator?.id,
  isSavingLogo: false,
  isUpdatingVerification: false,
  logo: props.operator?.logo ?? '',
  showAddressDialog: false,
  showChangeLogoDialog: false,
  showConfirmChangeSlugDialog: false,
  showConfirmRequestVerificationDialog: false,
  showConfirmRejectDialog: false,
  showConfirmVerifyDialog: false,
  showDeleteLogoDialog: false,
});
const formData = reactive<EditOperatorFormData>(
  formDataFromDto(props.operator),
);
const oldShopUrl = computed(() =>
  props.operator?.slug
    ? new URL(`/shops/${props.operator.slug}`, Config.baseUrl).toString()
    : '',
);
const newShopUrl = computed(() =>
  formData.slug
    ? new URL(`/shops/${formData.slug}`, Config.baseUrl).toString()
    : '',
);

async function isSlugAvailable(slug: string): Promise<boolean> {
  if (!helpers.req(slug)) return true;
  if (slug === props.operator?.slug) return true;

  let available = true;
  await oops(
    async () => {
      available = await client.operators.isSlugAvailable(slug);
    },
    {
      default: (error) => {
        /* eslint-disable-next-line no-console */
        console.error(error);
      },
    },
  );
  return available;
}

const v$ = useVuelidate(
  {
    address: {
      required: helpers.withMessage('Shop address is required', required),
    },
    description: {
      required: helpers.withMessage('Shop description is required', required),
    },
    email: {
      required: helpers.withMessage('Shop email is required', required),
      email: helpers.withMessage('Must be a valid email address', email),
    },
    name: {
      required: helpers.withMessage('Name of dive shop is required', required),
    },
    phone: {
      required: helpers.withMessage('Shop phone number is required', required),
      phone: helpers.withMessage(
        'Must be a valid phone number, including country code and area code',
        phone,
      ),
    },
    slug: {
      required: helpers.withMessage('URL shortcut is required', required),
      regex: helpers.withMessage(
        'Only letters, numbers, and URL-safe characters are allowed',
        helpers.regex(SlugRegex),
      ),
      conflict: helpers.withMessage(
        'Website URL is already taken',
        helpers.withAsync(isSlugAvailable),
      ),
    },
    website: {
      url: helpers.withMessage('Must be a valid URL', url),
    },
  },
  formData,
);

watch(
  () => formData.name,
  (name) => {
    if (state.autoUpdateSlug) {
      formData.slug = slugify(name, { lower: true, strict: true });
    }
  },
);

function onChangeAddress() {
  addressDialog.value?.reset();
  state.showAddressDialog = true;
}

function onCancelChangeAddress() {
  state.showAddressDialog = false;
}

function onConfirmChangeAddress(address: string, gps: GPSCoordinates | null) {
  formData.address = address;
  formData.gps = gps ?? null;
  state.showAddressDialog = false;
}

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  if (props.operator?.id && props.operator?.slug !== formData.slug) {
    state.showConfirmChangeSlugDialog = true;
  } else {
    onConfirmSave();
  }
}

function onConfirmSave() {
  state.showConfirmChangeSlugDialog = false;
  const dto: CreateOrUpdateOperatorDTO = {
    active: formData.active,
    name: formData.name,
    address: formData.address,
    description: formData.description,
    email: formData.email || undefined,
    gps: formData.gps ?? undefined,
    phone: formData.phone || undefined,
    website: formData.website || undefined,
    slug: formData.slug,
    socials: {
      facebook: formData.facebook || undefined,
      instagram: formData.instagram || undefined,
      tiktok: formData.tiktok || undefined,
      twitter: formData.twitter || undefined,
      youtube: formData.youtube || undefined,
    },
  };

  emit('save', dto);
}

function onCancelSave() {
  state.showConfirmChangeSlugDialog = false;
}

function onRequestVerification() {
  state.showConfirmRequestVerificationDialog = true;
}

async function onConfirmRequestVerification() {
  state.isUpdatingVerification = true;

  await oops(async () => {
    if (!props.operator) return;

    const operator = client.operators.wrapDTO(props.operator);
    await operator.requestVerification();

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
    const operator = client.operators.wrapDTO(props.operator);
    await operator.setVerified(true);
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
    const operator = client.operators.wrapDTO(props.operator);
    await operator.setVerified(false, message);
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

function onChangeLogo() {
  state.showChangeLogoDialog = true;
}

function onCancelChangeLogo() {
  state.showChangeLogoDialog = false;
}

async function onSaveLogo(file: File, coords: Coordinates): Promise<void> {
  state.isSavingLogo = true;

  await oops(async () => {
    if (!props.operator) return;
    const operator = client.operators.wrapDTO(props.operator);
    const logos = await operator.uploadLogo(file, coords);

    state.logo = logos.root;
    emit('logo-changed', logos.root);

    state.showChangeLogoDialog = false;
    toasts.toast({
      id: 'logo-changed',
      message: 'Shop logo has been updated',
      type: ToastType.Success,
    });
  });

  state.isSavingLogo = false;
}

function onDeleteLogo() {
  state.showDeleteLogoDialog = true;
}

function onCancelDeleteLogo() {
  state.showDeleteLogoDialog = false;
}

async function onConfirmDeleteLogo(): Promise<void> {
  await oops(async () => {
    const operator = client.operators.wrapDTO(props.operator);
    await operator.deleteLogo();

    state.logo = '';
    emit('logo-changed', undefined);
    toasts.toast({
      id: 'logo-deleted',
      message: 'Shop logo was successfully deleted',
      type: ToastType.Success,
    });
    state.showDeleteLogoDialog = false;
  });
}
</script>
