<template>
  <AddressDialog
    ref="addressDialog"
    :visible="showAddressDialog"
    :address="formData.address"
    :gps="formData.gps"
    @save="onConfirmChangeAddress"
    @cancel="onCancelChangeAddress"
  />

  <form @submit.prevent="onSave">
    <fieldset :disabled="isSaving">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10">
        <div>
          <TextHeading>Basic Info</TextHeading>

          <FormField
            label="Name"
            required
            :error="v$.name.$errors[0]?.$message"
            :invalid="v$.name.$error"
            :responsive="false"
          >
            <FormTextBox
              v-model.trim="formData.name"
              control-id="name"
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
            :error="v$.slug.$errors[0]?.$message"
            :invalid="v$.slug.$error"
            :responsive="false"
            help="This will be used to construct the URL to your dive shop. The text may
          contain lower-case letters, numbers, as well as URL-safe characters: -
          $ . + ! * ' ( )"
          >
            <FormTextBox
              v-model.trim="formData.slug"
              control-id="slug"
              test-id="slug"
              placeholder="my-dive-shop"
              :maxlength="200"
              :invalid="v$.slug.$error"
              @change="autoUpdateSlug = false"
            />
          </FormField>

          <FormField
            label="Description"
            required
            :error="v$.description.$errors[0]?.$message"
            :invalid="v$.description.$error"
            :responsive="false"
          >
            <FormTextArea
              v-model.trim="formData.description"
              control-id="description"
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
          >
            <div class="space-y-1.5 px-4">
              <p v-if="formData.address">
                <span>{{ formData.address }}</span>
              </p>

              <p v-if="formData.gps" class="space-x-2">
                <span class="text-danger">
                  <i class="fa-solid fa-location-dot"></i>
                </span>
                <span>{{ formData.gps.lat }}, {{ formData.gps.lon }}</span>
              </p>

              <FormButton size="sm" @click="onChangeAddress">
                {{ formData.address ? 'Change' : 'Set' }} Address...
              </FormButton>
            </div>
          </FormField>

          <FormField
            label="Phone"
            required
            :error="v$.phone.$errors[0]?.$message"
            :invalid="v$.phone.$error"
            :responsive="false"
          >
            <FormTextBox
              v-model.trim="formData.phone"
              control-id="phone"
              test-id="phone"
              :maxlength="50"
              :invalid="v$.phone.$error"
              placeholder="1 (555) 555-5555"
            />
          </FormField>

          <FormField
            label="Email"
            required
            :error="v$.email.$errors[0]?.$message"
            :invalid="v$.email.$error"
            :responsive="false"
          >
            <FormTextBox
              v-model.trim="formData.email"
              control-id="email"
              test-id="email"
              :maxlength="100"
              :invalid="v$.email.$error"
              placeholder="example@diveshop.com"
            />
          </FormField>

          <FormField
            label="Website"
            :error="v$.website.$errors[0]?.$message"
            :invalid="v$.website.$error"
            :responsive="false"
          >
            <FormTextBox
              v-model.trim="formData.website"
              control-id="website"
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
              <label class="sr-only" for="facebook">Facebook</label>
            </p>
            <FormTextBox
              v-model.trim="formData.facebook"
              class="w-full"
              control-id="facebook"
              test-id="facebook"
              :maxlength="100"
            />
          </div>

          <div class="flex gap-1.5 items-baseline w-full">
            <p>
              <span>
                <i class="fab fa-instagram fa-fw"></i>
              </span>
              <label class="sr-only" for="instagram">Instagram</label>
            </p>
            <FormTextBox
              v-model.trim="formData.instagram"
              class="w-full"
              control-id="instagram"
              test-id="instagram"
              :maxlength="100"
            />
          </div>

          <div class="flex gap-1.5 items-baseline w-full">
            <p>
              <span>
                <i class="fab fa-tiktok fa-fw"></i>
              </span>
              <label class="sr-only" for="tiktok">TikTok</label>
            </p>
            <FormTextBox
              v-model.trim="formData.tiktok"
              class="w-full"
              control-id="tiktok"
              test-id="tiktok"
              :maxlength="100"
            />
          </div>

          <div class="flex gap-1.5 items-baseline w-full">
            <p>
              <span>
                <i class="fa-brands fa-x-twitter fa-fw"></i>
              </span>
              <label class="sr-only" for="twitter">Twitter / X</label>
            </p>
            <FormTextBox
              v-model.trim="formData.twitter"
              class="w-full"
              control-id="twitter"
              test-id="twitter"
              :maxlength="100"
            />
          </div>

          <div class="flex gap-1.5 items-baseline w-full">
            <p>
              <span>
                <i class="fab fa-youtube fa-fw"></i>
              </span>
              <label class="sr-only" for="youtube">Youtube</label>
            </p>
            <FormTextBox
              v-model.trim="formData.youtube"
              class="w-full"
              control-id="youtube"
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
import { computed, reactive, ref, watch } from 'vue';

import { phone } from '../../validators';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import TextHeading from '../common/text-heading.vue';
import AddressDialog from '../dialog/address-dialog.vue';

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

const addressDialog = ref<InstanceType<typeof AddressDialog> | null>(null);

const props = withDefaults(defineProps<EditDiveOperatorProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save', data: CreateOrUpdateDiveOperatorDTO): void;
}>();
const autoUpdateSlug = ref(!props.operator);
const showAddressDialog = ref(false);
const slugConflict = ref(false);
const formData = reactive<EditDiveOperatorFormData>(
  formDataFromDto(props.operator),
);

const $externalResults = computed(() => ({
  slug: slugConflict.value ? ['URL shortcut is already taken'] : [],
}));
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
      required: helpers.withMessage('Phone number is required', required),
      phone: helpers.withMessage(
        'Must be a valid phone number, including country code and area code',
        phone,
      ),
    },
    slug: {
      required: helpers.withMessage('URL shortcut is required', required),
      regex: helpers.withMessage(
        'Only letters, numbers, and dashes are allowed',
        helpers.regex(SlugRegex),
      ),
    },
    website: {
      url: helpers.withMessage('Must be a valid URL', url),
    },
  },
  formData,
  {
    $externalResults,
  },
);

watch(
  () => formData.name,
  (name) => {
    if (autoUpdateSlug.value) {
      formData.slug = slugify(name, { lower: true, strict: true });
    }
  },
);

watch(
  () => formData.slug,
  () => {
    slugConflict.value = false;
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

defineExpose({
  markConflict() {
    slugConflict.value = true;
  },
});
</script>
