<template>
  <AddressDialog
    ref="addressDialog"
    :visible="showAddressDialog"
    :address="formData.address"
    :gps="formData.gps"
    @save="onConfirmChangeAddress"
    @cancel="onCancelChangeAddress"
  />

  <ConfirmDialog
    title="Change URL Shortcut?"
    confirm-text="Save Changes"
    :is-loading="isSaving"
    :visible="showConfirmChangeSlugDialog"
    size="md"
    dangerous
    @confirm="onConfirmSave"
    @cancel="onCancelSave"
  >
    <div class="space-y-3 text-center">
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

  <form @submit.prevent="onSave">
    <fieldset :disabled="isSaving">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10">
        <!-- TODO: Logo? Other fields? -->

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
                @change="autoUpdateSlug = false"
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
                  Avoid changing this unless you need to. Changing this value
                  will change the URL to your dive shop's page. Users' bookmarks
                  may be broken.
                </span>
              </p>
              <p v-else class="text-sm italic">
                This will be used to construct the URL to your dive shop. The
                text may contain lower-case letters, numbers, as well as
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
              <label class="sr-only" for="operator-facebook">Facebook</label>
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
              <label class="sr-only" for="operator-instagram">Instagram</label>
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
              <label class="sr-only" for="operator-twitter">Twitter / X</label>
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

      <div class="flex justify-center">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          test-id="btn-save-operator"
          submit
          @click="onSave"
        >
          {{ operator ? 'Save Changes' : 'Create Dive Shop' }}
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import {
  CreateOrUpdateDiveOperatorDTO,
  DiveOperatorDTO,
  GPSCoordinates,
  GpsCoordinates,
  SlugRegex,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required, url } from '@vuelidate/validators';

import slugify from 'slugify';
import { URL } from 'url';
import { computed, reactive, ref, watch } from 'vue';

import { useClient } from '../../api-client';
import { Config } from '../../config';
import { useOops } from '../../oops';
import { phone } from '../../validators';
import CopyButton from '../common/copy-button.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import TextHeading from '../common/text-heading.vue';
import AddressDialog from '../dialog/address-dialog.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

interface EditDiveOperatorFormData {
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

interface EditDiveOperatorProps {
  isSaving?: boolean;
  operator?: DiveOperatorDTO;
}

function formDataFromDto(dto?: DiveOperatorDTO): EditDiveOperatorFormData {
  return {
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

const addressDialog = ref<InstanceType<typeof AddressDialog> | null>(null);

const props = withDefaults(defineProps<EditDiveOperatorProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save', data: CreateOrUpdateDiveOperatorDTO): void;
}>();
const autoUpdateSlug = ref(!props.operator);
const showAddressDialog = ref(false);
const showConfirmChangeSlugDialog = ref(false);
const formData = reactive<EditDiveOperatorFormData>(
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
      available = await client.diveOperators.isSlugAvailable(slug);
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
    if (autoUpdateSlug.value) {
      formData.slug = slugify(name, { lower: true, strict: true });
    }
  },
);

function onChangeAddress() {
  addressDialog.value?.reset();
  showAddressDialog.value = true;
}

function onCancelChangeAddress() {
  showAddressDialog.value = false;
}

function onConfirmChangeAddress(address: string, gps: GPSCoordinates | null) {
  formData.address = address;
  formData.gps = gps ?? null;
  showAddressDialog.value = false;
}

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  if (props.operator?.id && props.operator?.slug !== formData.slug) {
    showConfirmChangeSlugDialog.value = true;
  } else {
    onConfirmSave();
  }
}

function onConfirmSave() {
  showConfirmChangeSlugDialog.value = false;
  const dto: CreateOrUpdateDiveOperatorDTO = {
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
  showConfirmChangeSlugDialog.value = false;
}
</script>
