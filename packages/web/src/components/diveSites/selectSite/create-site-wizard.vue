<template>
  <!-- Nav panel -->
  <p
    class="sticky -top-1 flex gap-2 text-sm font-title z-30 text-grey-700 bg-secondary rounded-md shadow-md p-2 -mx-1.5"
  >
    <span>
      <button
        class="font-bold text-link hover:text-link-hover"
        @click="() => onScrollTo(WizardStep.Location)"
      >
        1. Location
      </button>
    </span>
    <span>
      <i class="fa-solid fa-caret-right"></i>
    </span>
    <span>
      <button
        class="font-bold text-link hover:text-link-hover"
        @click="() => onScrollTo(WizardStep.Details)"
      >
        2. Details
      </button>
    </span>
    <span>
      <i class="fa-solid fa-caret-right"></i>
    </span>
    <span>
      <button
        class="font-bold text-link hover:text-link-hover"
        @click="() => onScrollTo(WizardStep.Metadata)"
      >
        3. Other Info
      </button>
    </span>
    <span>
      <i class="fa-solid fa-caret-right"></i>
    </span>
    <span>
      <button
        class="font-bold text-link hover:text-link-hover"
        @click="() => onScrollTo(WizardStep.Save)"
      >
        4. Save
      </button>
    </span>
  </p>

  <form class="space-y-3" @submit.prevent="onSave">
    <fieldset :disabled="isSaving">
      <!-- Location section -->
      <TextHeading ref="LocationHeading" class="pt-8" level="h3">
        1. Site Location
      </TextHeading>
      <div class="space-y-2 px-0 lg:px-16">
        <div>
          <FormField
            label="Locaton"
            control-id="newSiteLocation"
            :responsive="false"
            :invalid="v$.location.$error"
            :error="v$.location.$errors[0]?.$message"
            required
          >
            <PlacesAutoComplete
              v-model.trim="formData.location"
              control-id="newSiteLocation"
              test-id="new-site-location"
              :maxlength="200"
              placeholder="Address or nearest town/city..."
              :invalid="v$.location.$error"
              autofocus
              @place-changed="onLocationChange"
            />
          </FormField>
        </div>

        <FormField label="Site entrance" :responsive="false" required>
          <p class="text-secondary">
            <span class="mr-2">
              <i class="fa-solid fa-circle-exclamation"></i>
            </span>
            <span>Place a marker on the map to indicate the </span>
            <span class="font-bold">entrance</span>
            <span> to the dive site.</span>
          </p>

          <GoogleMap ref="map" :marker="gps" @click="onMapClick" />
        </FormField>

        <div class="flex justify-evenly">
          <div class="flex gap-1 items-baseline pr-2">
            <FormLabel label="Lat" control-id="newSiteLat" required />
            <div class="grow">
              <FormTextBox
                v-model.number="formData.gps.lat"
                control-id="newSiteLat"
                test-id="new-site-lat"
                :invalid="v$.gps.lat.$error"
                :maxlength="20"
              />
              <p
                v-if="v$.gps.lat.$error"
                class="text-sm text-danger dark:text-danger-dark"
              >
                {{ v$.gps.lat.$errors[0]?.$message }}
              </p>
            </div>
          </div>

          <div class="flex gap-1 items-baseline pl-2">
            <FormLabel label="Lon" control-id="newSiteLon" required />
            <div class="grow">
              <FormTextBox
                v-model.number="formData.gps.lon"
                control-id="newSiteLon"
                test-id="new-site-lon"
                :invalid="v$.gps.lon.$error"
                :maxlength="20"
              />
              <p
                v-if="v$.gps.lon.$error"
                class="text-sm text-danger dark:text-danger-dark"
              >
                {{ v$.gps.lon.$errors[0]?.$message }}
              </p>
            </div>
          </div>
        </div>

        <FormField label="Directions to site entrance" :responsive="false">
          <FormTextArea
            v-model.trim="formData.directions"
            control-id="newSiteDirections"
            test-id="new-site-directions"
            :maxlength="500"
            placeholder="E.g. Park across the street and then take the stairs down to the water..."
          />
        </FormField>
      </div>

      <!-- Details section -->
      <TextHeading ref="DetailsHeading" class="pt-8" level="h3">
        2. Site details
      </TextHeading>
      <div class="space-y-2 px-0 lg:px-16">
        <FormField
          label="Name"
          control-id="newSiteName"
          :responsive="false"
          :invalid="v$.name.$error"
          :error="v$.name.$errors[0]?.$message"
          required
        >
          <FormTextBox
            v-model.trim="formData.name"
            control-id="newSiteName"
            test-id="new-site-name"
            :maxlength="200"
            :invalid="v$.name.$error"
            placeholder="Name of the dive site..."
          />
        </FormField>

        <FormField
          label="Max depth"
          control-id="newSiteDepth"
          :responsive="false"
          :invalid="v$.depth.$error"
          :error="v$.depth.$errors[0]?.$message"
        >
          <DepthInput
            v-model="formData.depth"
            control-id="newSiteDepth"
            test-id="new-site-depth"
            :invalid="v$.depth.$error"
          />
        </FormField>

        <FormField
          label="Description"
          control-id="newSiteDescription"
          :responsive="false"
        >
          <FormTextArea
            v-model="formData.description"
            control-id="newSiteDescription"
            test-id="new-site-description"
            :maxlength="2000"
            :rows="5"
            resize="vertical"
            placeholder="Give the site a good description for other divers!"
          />
        </FormField>
      </div>

      <TextHeading ref="MetadataHeading" class="pt-8" level="h3">
        3. Other Info
      </TextHeading>
      <div class="space-y-2 px-0 lg:px-16">
        <FormField label="Free to dive" :responsive="false" required>
          <div class="ml-2">
            <p class="text-sm italic text-grey-300">
              Is a fee required to dive here?
            </p>
            <div class="flex gap-2">
              <FormRadio
                v-model="formData.freeToDive"
                control-id="freeToDiveUndefined"
                test-id="free-to-dive-undefined"
                group="freeToDive"
                value=""
              >
                Unknown
              </FormRadio>
              <FormRadio
                v-model="formData.freeToDive"
                control-id="freeToDiveTrue"
                test-id="free-to-dive-true"
                group="freeToDive"
                value="true"
              >
                Yes
              </FormRadio>
              <FormRadio
                v-model="formData.freeToDive"
                control-id="freeToDiveFalse"
                test-id="free-to-dive-false"
                group="freeToDive"
                value="false"
              >
                No
              </FormRadio>
            </div>
          </div>
        </FormField>

        <FormField label="Shore access" :responsive="false" required>
          <div class="ml-2">
            <p class="text-sm italic text-grey-300">
              Is the site accessible from the shore?
            </p>
            <div class="flex gap-2">
              <FormRadio
                v-model="formData.shoreAccess"
                control-id="shoreAccessUndefined"
                test-id="shore-access-undefined"
                group="shoreAccess"
                value=""
              >
                Unknown
              </FormRadio>
              <FormRadio
                v-model="formData.shoreAccess"
                control-id="shoreAccessTrue"
                test-id="shore-access-true"
                group="shoreAccess"
                value="true"
              >
                Yes
              </FormRadio>
              <FormRadio
                v-model="formData.shoreAccess"
                control-id="shoreAccessFalse"
                test-id="shore-access-false"
                group="shoreAccess"
                value="false"
              >
                No
              </FormRadio>
            </div>
          </div>
        </FormField>
      </div>

      <TextHeading ref="SaveHeading" class="pt-8" level="h3">
        4. Save
      </TextHeading>
      <div class="space-y-2 px-0 lg:px-16">
        <div
          v-if="v$.$error"
          class="flex gap-3 text-danger dark:text-danger-dark"
        >
          <div>
            <span>
              <i class="fa-solid fa-circle-exclamation"></i>
            </span>
          </div>

          <div class="space-y-1">
            <p class="font-bold">Unable to save new site.</p>
            <p>
              There are errors in the form above. Please resolve these issues
              and try again:
            </p>
            <ul class="italic list-inside list-disc px-2">
              <li v-for="error in v$.$errors" :key="error.$uid">
                {{ error.$message }}
              </li>
            </ul>
          </div>
        </div>
        <FormButton
          type="primary"
          test-id="save-new-site"
          :is-loading="isSaving"
          submit
        >
          Save New Dive Site
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import {
  CreateOrUpdateDiveSiteDTO,
  DepthDTO,
  DepthUnit,
  GPSCoordinates,
} from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { Ref, computed, reactive, ref } from 'vue';

import DepthInput from '../../common/depth-input.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import FormLabel from '../../common/form-label.vue';
import FormRadio from '../../common/form-radio.vue';
import FormTextArea from '../../common/form-text-area.vue';
import FormTextBox from '../../common/form-text-box.vue';
import GoogleMap from '../../common/google-map.vue';
import PlacesAutoComplete from '../../common/places-auto-complete.vue';
import TextHeading from '../../common/text-heading.vue';

enum WizardStep {
  Location = 'location',
  Details = 'details',
  Metadata = 'metadata',
  Save = 'save',
}

interface CreateSiteWizardProps {
  isSaving?: boolean;
}

interface CreateSiteWizardFormData {
  depth: DepthDTO | null;
  description: string;
  directions: string;
  freeToDive: string;
  gps: {
    lat: string | number;
    lon: string | number;
  };
  location: string;
  name: string;
  shoreAccess: string;
}

const LocationHeading = ref<InstanceType<typeof TextHeading> | null>(null);
const DetailsHeading = ref<InstanceType<typeof TextHeading> | null>(null);
const MetadataHeading = ref<InstanceType<typeof TextHeading> | null>(null);
const SaveHeading = ref<InstanceType<typeof TextHeading> | null>(null);
const HeadingRefs: Record<
  WizardStep,
  Ref<InstanceType<typeof TextHeading> | null>
> = {
  [WizardStep.Location]: LocationHeading,
  [WizardStep.Details]: DetailsHeading,
  [WizardStep.Metadata]: MetadataHeading,
  [WizardStep.Save]: SaveHeading,
} as const;

const formData = reactive<CreateSiteWizardFormData>({
  directions: '',
  depth: null,
  description: '',
  freeToDive: '',
  gps: {
    lat: '',
    lon: '',
  },
  location: '',
  name: '',
  shoreAccess: '',
});
const emit = defineEmits<{
  (e: 'save', site: CreateOrUpdateDiveSiteDTO): void;
}>();
withDefaults(defineProps<CreateSiteWizardProps>(), {
  isSaving: false,
});

const gps = computed<GPSCoordinates | undefined>(() => {
  if (
    typeof formData.gps.lat === 'number' &&
    typeof formData.gps.lon === 'number'
  ) {
    return {
      lat: formData.gps.lat,
      lon: formData.gps.lon,
    };
  }

  return undefined;
});
const map = ref<InstanceType<typeof GoogleMap> | null>(null);

const v$ = useVuelidate(
  {
    depth: {
      valid: helpers.withMessage(
        'Depth must be a positive number and no more than 300m (984ft)',
        (value: DepthDTO | string | null) => {
          if (!helpers.req(value)) return true;
          if (!value || typeof value === 'string') return false;
          if (value.depth <= 0) return false;

          return value.unit === DepthUnit.Meters
            ? value.depth <= 300
            : value.depth <= 984.252;
        },
      ),
    },
    gps: {
      lat: {
        required: helpers.withMessage('Latitude is required', required),
        latitude: helpers.withMessage(
          'Latitude must be between -90.0 and 90.0',
          (value) => {
            if (!helpers.req(value)) return true;
            const lat = Number(value);
            return !isNaN(lat) && lat >= -90 && lat <= 90;
          },
        ),
      },
      lon: {
        required: helpers.withMessage('Longitude is required', required),
        longitude: helpers.withMessage(
          'Longitude must be between -180.0 and 180.0',
          (value) => {
            if (!helpers.req(value)) return true;
            const lon = Number(value);
            return !isNaN(lon) && lon >= -180 && lon <= 180;
          },
        ),
      },
    },
    location: {
      required: helpers.withMessage('Location is required', required),
    },
    name: {
      required: helpers.withMessage('Name is required', required),
    },
  },
  formData,
);

function onLocationChange(newLocation: NonNullable<GPSCoordinates>) {
  if (!gps.value) {
    formData.gps = newLocation;
    map.value?.moveCenter(newLocation);
  }
}

function onMapClick(coords: GPSCoordinates) {
  if (coords) {
    formData.gps.lat = coords.lat;
    formData.gps.lon = coords.lon;
  }
}

function onScrollTo(step: WizardStep) {
  HeadingRefs[step].value?.$el.scrollIntoView({
    behavior: 'smooth',
  });
}

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  const diveStie: CreateOrUpdateDiveSiteDTO = {
    location: formData.location,
    name: formData.name,
    depth: formData.depth ?? undefined,
    description: formData.description || undefined,
    directions: formData.directions || undefined,
    freeToDive: formData.freeToDive.length
      ? Boolean(formData.freeToDive)
      : undefined,
    gps: gps.value,
    shoreAccess: formData.shoreAccess.length
      ? Boolean(formData.shoreAccess)
      : undefined,
  };

  emit('save', diveStie);
}
</script>
