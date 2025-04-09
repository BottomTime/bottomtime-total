<template>
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

  <form @submit.prevent="">
    <fieldset :disabled="isSaving" class="space-y-6">
      <div class="flex flex-col lg:flex-row gap-4">
        <figure v-if="operator.id" class="px-2 py-6">
          <!-- Manage Logo -->
          <div
            v-if="state.logo"
            class="flex flex-col gap-2 justify-center items-center"
          >
            <img
              :src="`${operator.logo}/128x128?t=${state.logoUpdated}`"
              class="rounded-lg min-w-[128px] min-h-[128px]"
            />
            <div class="flex justify-center">
              <FormButton
                class="text-nowrap"
                size="xs"
                rounded="left"
                control-id="btn-change-logo"
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
                control-id="btn-delete-logo"
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
            <div class="w-[128px] h-[128px] mx-auto">
              <i class="fa-solid fa-image fa-8x"></i>
            </div>
            <FormButton
              class="text-nowrap"
              size="xs"
              control-id="btn-upload-logo"
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

        <article class="space-y-3">
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

                  <p v-if="operator.id" class="text-sm">
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
                <p class="text-sm italic">
                  Active shops will appear in search results and on the map.
                  Inactive shops will still be visible on the site (if, say, a
                  user follows a link to your shop) but will not appear in
                  search results.
                </p>
              </FormField>
            </div>

            <div>
              <TextHeading>Contact Info</TextHeading>

              <FormField
                label="Location"
                required
                :invalid="v$.address.$error"
                :responsive="false"
                test-id="operator-location"
              >
                <div class="space-y-2">
                  <PlacesAutoComplete
                    v-model="formData.address"
                    control-id="operator-address"
                    test-id="operator-address"
                    :maxlength="500"
                    :invalid="v$.address.$error"
                    @place-changed="onChangeAddress"
                  />
                  <p
                    v-if="v$.address.$error"
                    class="text-sm text-danger"
                    data-testid="operator-address-error"
                  >
                    {{ v$.address.$errors[0]?.$message }}
                  </p>
                  <FormLocationPicker v-model="formData.gps" class="px-2" />
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
                <div class="grow">
                  <FormTextBox
                    v-model.trim="formData.facebook"
                    control-id="operator-facebook"
                    test-id="facebook"
                    :maxlength="100"
                    :invalid="v$.facebook.$error"
                  />
                  <p v-if="v$.facebook.$error" class="text-sm text-danger">
                    {{ v$.facebook.$errors[0]?.$message }}
                  </p>
                </div>
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
        </article>
      </div>

      <div v-if="v$.$error" class="text-sm text-danger">
        <p>Please correct the following errors before proceeding</p>
        <ul
          class="italic list-inside list-disc px-4"
          data-testid="operator-errors"
        >
          <li v-for="error in v$.$errors" :key="error.$uid">
            {{ error.$message }}
          </li>
        </ul>
      </div>

      <div class="flex justify-center gap-3">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          control-id="btn-save-operator"
          test-id="btn-save-operator"
          submit
          @click="onSave"
        >
          <p class="space-x-2">
            <span>
              <i class="fa-regular fa-floppy-disk"></i>
            </span>
            <span>
              {{ operator.id ? 'Save Changes' : 'Create Dive Shop' }}
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

<script setup lang="ts">
import {
  CreateOrUpdateOperatorDTO,
  GpsCoordinates,
  OperatorDTO,
  SlugRegex,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required, url } from '@vuelidate/validators';

import slugify from 'slugify';
import { useLogger } from 'src/logger';
import { computed, reactive, watch } from 'vue';

import { useClient } from '../../../api-client';
import { Coordinates, ToastType } from '../../../common';
import { Config } from '../../../config';
import { useOops } from '../../../oops';
import { useToasts } from '../../../store';
import { phone } from '../../../validators';
import CopyButton from '../../common/copy-button.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import FormLocationPicker from '../../common/form-location-picker.vue';
import FormTextArea from '../../common/form-text-area.vue';
import FormTextBox from '../../common/form-text-box.vue';
import FormToggle from '../../common/form-toggle.vue';
import PlacesAutoComplete from '../../common/places-auto-complete.vue';
import TextHeading from '../../common/text-heading.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import UploadImageDialog from '../../dialog/upload-image-dialog.vue';

interface EditOperatorInfoProps {
  isSaving?: boolean;
  operator: OperatorDTO;
}

interface EditOperatorInfoState {
  autoUpdateSlug: boolean;
  isSavingLogo: boolean;
  logo: string;
  logoUpdated: number;
  showAddressDialog: boolean;
  showChangeLogoDialog: boolean;
  showConfirmChangeSlugDialog: boolean;
  showDeleteLogoDialog: boolean;
}

interface EditOperatorInfoFormData {
  active: boolean;
  address: string;
  description: string;
  email: string;
  facebook: string;
  gps?: GpsCoordinates;
  instagram: string;
  name: string;
  phone: string;
  slug: string;
  tiktok: string;
  twitter: string;
  website: string;
  youtube: string;
}

const client = useClient();
const log = useLogger('EditOperatorInfo');
const oops = useOops();
const toasts = useToasts();

function formDataFromDto(dto: OperatorDTO): EditOperatorInfoFormData {
  return {
    active: typeof dto.active === 'boolean' ? dto.active : true,
    address: dto.address || '',
    description: dto.description || '',
    email: dto.email || '',
    facebook: dto.socials?.facebook || '',
    gps: dto.gps,
    instagram: dto.socials?.instagram || '',
    name: dto.name || '',
    phone: dto.phone || '',
    slug: dto.slug || '',
    tiktok: dto.socials?.tiktok || '',
    twitter: dto.socials?.twitter || '',
    website: dto.website || '',
    youtube: dto.socials?.youtube || '',
  };
}

const props = withDefaults(defineProps<EditOperatorInfoProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'delete', operator: OperatorDTO): void;
  (e: 'logo-changed', logo: string | undefined): void;
  (e: 'save', data: CreateOrUpdateOperatorDTO): void;
}>();
const state = reactive<EditOperatorInfoState>({
  autoUpdateSlug: !props.operator.id,
  isSavingLogo: false,
  logo: props.operator.logo ?? '',
  logoUpdated: Date.now(),
  showAddressDialog: false,
  showChangeLogoDialog: false,
  showConfirmChangeSlugDialog: false,
  showDeleteLogoDialog: false,
});
const formData = reactive<EditOperatorInfoFormData>(
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
  if (!slug || slug === props.operator.slug) return true;

  let available = true;
  await oops(
    async () => {
      available = await client.operators.isSlugAvailable(slug);
    },
    {
      default: (error) => {
        log.error(error as Error);
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
    facebook: {
      regex: helpers.withMessage(
        'Must be a valid Facebook username',
        helpers.regex(/^[a-z0-9.]+$/i),
      ),
    },
  },
  formData,
);

function onChangeAddress(coordinates: GpsCoordinates) {
  formData.gps = coordinates;
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

    const logos = await client.operators.uploadLogo(
      props.operator,
      file,
      coords,
    );
    state.logo = logos.root;
    emit('logo-changed', logos.root);

    state.logoUpdated = Date.now();
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
    await client.operators.deleteLogo(props.operator.slug);

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
  formData.slug = props.operator.slug;
  state.showConfirmChangeSlugDialog = false;
}

watch(
  () => formData.name,
  (name) => {
    if (state.autoUpdateSlug) {
      formData.slug = slugify(name, { lower: true, strict: true });
    }
  },
);

watch(
  () => props.operator,
  (data) => {
    Object.assign(formData, formDataFromDto(data));
    state.autoUpdateSlug = !data.id;
    state.logo = data.logo ?? '';
  },
);
</script>
