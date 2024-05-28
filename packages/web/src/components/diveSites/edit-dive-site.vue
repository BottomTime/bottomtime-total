<template>
  <ConfirmDialog
    :visible="showConfirmCancelDialog"
    confirm-text="Discard changes"
    title="Discard changes?"
    @confirm="onConfirmDiscard"
    @cancel="onCancelDiscard"
  >
    <div class="flex gap-3">
      <span class="text-warning mt-2">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
      </span>
      <p>
        Are you sure you want to discard your changes? Any unsaved changes will
        be lost.
      </p>
    </div>
  </ConfirmDialog>

  <form data-testid="edit-dive-site-form" @submit.prevent="">
    <fieldset
      class="grid grid-cols-1 lg:grid-cols-5 gap-3"
      :disabled="isSaving"
    >
      <div class="col-span-1 lg:col-span-3">
        <TextHeading>Site Info</TextHeading>

        <FormField
          label="Name"
          control-id="name"
          required
          :invalid="v$.name.$error"
          :error="v$.name.$errors[0]?.$message"
        >
          <FormTextBox
            v-model.trim="state.name"
            control-id="name"
            test-id="name"
            :maxlength="200"
            placeholder="Name of the dive site"
            :invalid="v$.name.$error"
            autofocus
          />
        </FormField>

        <FormField label="Description" control-id="description">
          <FormTextArea
            v-model.trim="state.description"
            control-id="description"
            test-id="description"
            :maxlength="2000"
            :rows="7"
          />
        </FormField>

        <FormField
          label="Depth"
          control-id="depth"
          :invalid="v$.depth.$error"
          :error="v$.depth.$errors[0]?.$message"
        >
          <div class="flex flex-wrap gap-3">
            <FormTextBox
              v-model.trim="state.depth.depth"
              class="w-32"
              control-id="depth"
              test-id="depth"
              :invalid="v$.depth.$error"
              :maxlength="6"
              :disabled="state.depth.bottomless"
            />
            <FormSelect
              v-model="state.depth.unit"
              control-id="depth-unit"
              test-id="depth-unit"
              :options="DepthOptions"
              :disabled="state.depth.bottomless"
            />
            <FormCheckbox
              v-model="state.depth.bottomless"
              control-id="depth-bottomless"
              test-id="depth-bottomless"
            >
              bottomless
            </FormCheckbox>
          </div>
        </FormField>

        <FormField label="Free to dive" required>
          <div
            class="flex flex-col lg:flex-row flex-wrap ml-2 lg:ml-0 mt-1.5 gap-4 lg:items-center"
          >
            <FormRadio
              v-model="state.freeToDive"
              control-id="free-to-dive-true"
              group="free-to-dive"
              test-id="free-to-dive-true"
              value="true"
            >
              Free to dive
            </FormRadio>

            <FormRadio
              v-model="state.freeToDive"
              control-id="free-to-dive-false"
              group="free-to-dive"
              test-id="free-to-dive-false"
              value="false"
            >
              Payment required
            </FormRadio>

            <FormRadio
              v-model="state.freeToDive"
              control-id="free-to-dive-null"
              group="free-to-dive"
              test-id="free-to-dive-null"
              value=""
            >
              Unknown
            </FormRadio>
          </div>
        </FormField>

        <FormField label="Shore access" required>
          <div
            class="flex flex-col lg:flex-row flex-wrap ml-2 lg:ml-0 mt-1.5 gap-4 lg:items-center"
          >
            <FormRadio
              v-model="state.shoreAccess"
              control-id="shore-access-true"
              group="shore-access"
              test-id="shore-access-true"
              value="true"
            >
              Accessible from shore
            </FormRadio>

            <FormRadio
              v-model="state.shoreAccess"
              control-id="shore-access-false"
              group="shore-access"
              test-id="shore-access-false"
              value="false"
            >
              Boat access only
            </FormRadio>

            <FormRadio
              v-model="state.shoreAccess"
              control-id="shore-access-null"
              group="shore-access"
              test-id="shore-access-null"
              value=""
            >
              Unknown
            </FormRadio>
          </div>
        </FormField>

        <FormField label="Water type" required>
          <div
            class="flex flex-col lg:flex-row flex-wrap ml-2 lg:ml-0 mt-1.5 gap-4 lg:items-center"
          >
            <FormRadio
              v-model="state.waterType"
              control-id="water-type-salt"
              group="water-type"
              test-id="water-type-salt"
              :value="WaterType.Salt"
            >
              Salt
            </FormRadio>

            <FormRadio
              v-model="state.waterType"
              control-id="water-type-fresh"
              group="water-type"
              test-id="water-type-fresh"
              :value="WaterType.Fresh"
            >
              Fresh
            </FormRadio>

            <FormRadio
              v-model="state.waterType"
              control-id="water-type-mixed"
              group="water-type"
              test-id="water-type-mixed"
              :value="WaterType.Mixed"
            >
              Mixed
            </FormRadio>

            <FormRadio
              v-model="state.waterType"
              control-id="water-type-null"
              group="water-type"
              test-id="water-type-null"
              value=""
            >
              Unknown
            </FormRadio>
          </div>
        </FormField>
      </div>

      <FormBox class="col-span-1 lg:col-span-2 flex flex-col gap-3">
        <FormField
          label="Location"
          control-id="location"
          :invalid="v$.location.$error"
          :error="v$.location.$errors[0]?.$message"
          :responsive="false"
          required
        >
          <FormTextBox
            v-model.trim="state.location"
            control-id="location"
            test-id="location"
            :maxlength="200"
            :invalid="v$.location.$error"
            placeholder="Nearest city or landmark"
          />
        </FormField>

        <GoogleMap
          :marker="gps"
          :disabled="isSaving"
          @click="onLocationChanged"
        />

        <div class="flex flex-nowrap px-2 items-baseline gap-1">
          <label class="font-bold text-right">Lat:</label>
          <FormTextBox
            v-model.trim="state.gps.lat"
            control-id="gps-lat"
            test-id="gps-lat"
            :maxlength="10"
            :invalid="v$.gps.lat.$error"
          />

          <div class="grow"></div>

          <label class="font-bold text-right">Lon:</label>
          <FormTextBox
            v-model.trim="state.gps.lon"
            control-id="gps-lon"
            test-id="gps-lon"
            :maxlength="10"
            :invalid="v$.gps.lon.$error"
          />
        </div>

        <ul
          v-if="v$.gps.lat.$error || v$.gps.lon.$error"
          class="text-danger text-sm list-disc list-inside ml-10"
          data-testid="gps-errors"
        >
          <li v-if="v$.gps.lat.$error">
            {{ v$.gps.lat.$errors[0]?.$message }}
          </li>
          <li v-if="v$.gps.lon.$error">
            {{ v$.gps.lon.$errors[0]?.$message }}
          </li>
        </ul>

        <FormField
          label="Directions"
          control-id="directions"
          :responsive="false"
        >
          <FormTextArea
            v-model.trim="state.directions"
            control-id="directions"
            test-id="directions"
            placeholder="How to get to the site entrance..."
            :maxlength="500"
            :rows="5"
          />
        </FormField>
      </FormBox>
    </fieldset>

    <div class="flex gap-3 mt-6 w-full justify-center">
      <FormButton
        type="primary"
        control-id="save-site"
        test-id="save-site"
        :is-loading="isSaving"
        submit
        @click="onSave"
      >
        Save Changes
      </FormButton>

      <FormButton
        control-id="reset-site"
        test-id="reset-site"
        :disabled="isSaving"
        @click="onDiscard"
      >
        Reset
      </FormButton>
    </div>
  </form>
</template>

<script lang="ts" setup>
import {
  CreateOrUpdateDiveSiteDTO,
  DepthUnit,
  DiveSiteDTO,
  GpsCoordinates,
  WaterType,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required, requiredIf } from '@vuelidate/validators';

import { computed, reactive, ref } from 'vue';

import { useClient } from '../../api-client';
import { SelectOption, ToastType } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import FormField from '../common/form-field.vue';
import FormRadio from '../common/form-radio.vue';
import FormSelect from '../common/form-select.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import GoogleMap from '../common/google-map.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

type EditDiveSiteProps = {
  site: DiveSiteDTO;
};

type EditDiveSiteFormState = {
  name: string;
  description: string;
  depth: {
    depth: string;
    unit: DepthUnit;
    bottomless: boolean;
  };
  location: string;
  directions: string;
  gps: {
    lat: string;
    lon: string;
  };
  freeToDive: string;
  shoreAccess: string;
  waterType: WaterType | '';
};

const DepthOptions: SelectOption[] = [
  { label: 'Meters', value: DepthUnit.Meters },
  { label: 'Feet', value: DepthUnit.Feet },
];

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<EditDiveSiteProps>();
const state = reactive<EditDiveSiteFormState>(loadFromProps());
const isSaving = ref(false);
const showConfirmCancelDialog = ref(false);

const gps = computed<GpsCoordinates | undefined>(() => {
  const lat = parseFloat(state.gps.lat);
  const lon = parseFloat(state.gps.lon);

  if (!isNaN(lat) && !isNaN(lon)) {
    return { lat, lon };
  }

  return undefined;
});

const emit = defineEmits<{
  (e: 'site-updated', site: DiveSiteDTO): void;
}>();

const v$ = useVuelidate(
  {
    name: { required: helpers.withMessage('Name is required', required) },
    depth: {
      depth: {
        minValue: helpers.withMessage(
          'Depth must be a positive value',
          (value: string) => validateNumber(value, 0),
        ),
      },
    },
    location: {
      required: helpers.withMessage('Location is required', required),
    },
    gps: {
      lat: {
        required: helpers.withMessage(
          'Latitude is required if longitude is provided',
          requiredIf(() => !!state.gps.lon),
        ),
        valid: helpers.withMessage(
          'Latitude must be a number between -90 and 90',
          (value: string) => validateNumber(value, -90, 90),
        ),
      },
      lon: {
        required: helpers.withMessage(
          'Longitude is required if latitude is provided',
          requiredIf(() => !!state.gps.lat),
        ),
        valid: helpers.withMessage(
          'Longitude must be a number between -180 and 180',
          (value: string) => validateNumber(value, -180, 180),
        ),
      },
    },
  },
  state,
);

function validateNumber(value: string, min?: number, max?: number): boolean {
  if (value === '') return true;

  const parsed = parseFloat(value);
  if (isNaN(parsed)) return false;

  if (typeof min === 'number' && parsed < min) return false;
  if (typeof max === 'number' && parsed > max) return false;

  return true;
}

function loadFromProps(): EditDiveSiteFormState {
  return {
    name: props.site.name,
    description: props.site.description || '',
    depth: {
      depth: props.site.depth?.depth?.toString() || '',
      unit:
        props.site.depth?.unit ||
        currentUser.user?.settings.depthUnit ||
        DepthUnit.Meters,
      bottomless: false,
    },
    location: props.site.location,
    directions: props.site.directions || '',
    gps: props.site.gps
      ? {
          lat: props.site.gps.lat.toString(),
          lon: props.site.gps.lon.toString(),
        }
      : { lat: '', lon: '' },
    freeToDive: props.site.freeToDive?.toString() || '',
    shoreAccess: props.site.shoreAccess?.toString() || '',
    waterType: props.site.waterType || '',
  };
}

function onLocationChanged(location: GpsCoordinates) {
  state.gps.lat = location.lat.toString();
  state.gps.lon = location.lon.toString();
}

async function createSite(): Promise<void> {
  const depth = parseFloat(state.depth.depth);

  const data: CreateOrUpdateDiveSiteDTO = {
    name: state.name,
    description: state.description || undefined,
    depth: isNaN(depth) ? undefined : { depth, unit: state.depth.unit },
    location: state.location,
    directions: state.directions || undefined,
    gps: gps.value ?? undefined,
    freeToDive:
      state.freeToDive === '' ? undefined : state.freeToDive === 'true',
    shoreAccess:
      state.shoreAccess === '' ? undefined : state.shoreAccess === 'true',
    waterType: state.waterType || undefined,
  };

  const newSite = await client.diveSites.createDiveSite(data);

  toasts.toast({
    id: 'site-created',
    message: 'Dive site was successfully created',
    type: ToastType.Success,
  });
  emit('site-updated', newSite.toJSON());
}

async function updateSite(): Promise<void> {
  const depth = parseFloat(state.depth.depth);

  const dto = client.diveSites.wrapDTO(props.site);
  dto.name = state.name;
  dto.description = state.description || undefined;
  dto.depth = isNaN(depth)
    ? undefined
    : {
        depth,
        unit: state.depth.unit,
        // bottomless: state.depth.bottomless,
      };
  dto.location = state.location;
  dto.directions = state.directions || undefined;
  dto.gps = gps.value ?? undefined;
  dto.freeToDive =
    state.freeToDive === '' ? undefined : state.freeToDive === 'true';
  dto.shoreAccess =
    state.shoreAccess === '' ? undefined : state.shoreAccess === 'true';
  dto.waterType = state.waterType || undefined;

  await dto.save();

  toasts.toast({
    id: 'site-updated',
    message: 'Dive site was successfully updated',
    type: ToastType.Success,
  });
  emit('site-updated', dto.toJSON());
}

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  isSaving.value = true;

  await oops(async () => {
    if (props.site.id) await updateSite();
    else await createSite();
  });

  isSaving.value = false;
}

function onDiscard(): void {
  showConfirmCancelDialog.value = true;
}

function onCancelDiscard(): void {
  showConfirmCancelDialog.value = false;
}

function onConfirmDiscard(): void {
  const newState = loadFromProps();
  Object.assign(state, newState);
  v$.value.$reset();
  showConfirmCancelDialog.value = false;
}
</script>
