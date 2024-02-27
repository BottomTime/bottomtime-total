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

  <form @submit.prevent="">
    <fieldset
      class="grid grid-cols-1 lg:grid-cols-5 gap-3"
      :disabled="isSaving"
    >
      <div class="col-span-1 lg:col-span-3">
        <TextHeading>Site Info</TextHeading>

        <FormField label="Name" control-id="name" required>
          <FormTextBox
            v-model.trim="state.name"
            control-id="name"
            test-id="name"
            :maxlength="200"
            placeholder="Name of the dive site"
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

        <FormField label="Depth" control-id="depth">
          <div class="flex flex-wrap gap-3">
            <FormTextBox
              v-model.number="state.depth.depth"
              class="w-32"
              control-id="depth"
              test-id="depth"
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
      </div>

      <FormBox class="col-span-1 lg:col-span-2 flex flex-col gap-3">
        <TextHeading>Location</TextHeading>
        <FormTextBox
          v-model.trim="state.location"
          control-id="location"
          test-id="location"
          :maxlength="200"
          placeholder="Nearest city or landmark"
        />
        <GoogleMap :location="gps" @location-changed="onLocationChanged" />
        <div class="flex flex-nowrap px-2 items-baseline gap-1">
          <label class="font-bold text-right">Lat:</label>
          <FormTextBox
            v-model.number="state.gps.lat"
            control-id="gps-lat"
            test-id="gps-lat"
            :maxlength="10"
          />
          <div class="grow"></div>
          <label class="font-bold text-right">Lon:</label>
          <FormTextBox
            v-model.number="state.gps.lon"
            control-id="gps-lon"
            test-id="gps-lon"
            :maxlength="10"
          />
        </div>

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
        @click="onSave"
      >
        Save Changes
      </FormButton>
      <FormButton
        control-id="cancel-save-site"
        test-id="cancel-save-site"
        :disabled="isSaving"
        @click="onDiscard"
      >
        Reset
      </FormButton>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { DepthUnit, DiveSiteDTO, GpsCoordinates } from '@bottomtime/api';

import { computed, reactive, ref } from 'vue';

import { useClient } from '../../client';
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
    depth: string | number;
    unit: DepthUnit;
    bottomless: boolean;
  };
  location: string;
  directions: string;
  gps: {
    lat: string | number;
    lon: string | number;
  };
  freeToDive: string;
  shoreAccess: string;
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

const gps = computed<GpsCoordinates | null>(() => {
  if (typeof state.gps.lat === 'number' && typeof state.gps.lon === 'number') {
    return {
      lat: state.gps.lat,
      lon: state.gps.lon,
    };
  }

  return null;
});

const emit = defineEmits<{
  (e: 'site-updated', site: DiveSiteDTO): void;
}>();

function loadFromProps(): EditDiveSiteFormState {
  return {
    name: props.site.name,
    description: props.site.description || '',
    depth: {
      depth: props.site.depth?.depth || '',
      unit:
        props.site.depth?.unit ||
        currentUser.user?.settings.depthUnit ||
        DepthUnit.Meters,
      bottomless: false,
    },
    location: props.site.location,
    directions: props.site.directions || '',
    gps: {
      lat: props.site.gps?.lat || '',
      lon: props.site.gps?.lon || '',
    },
    freeToDive: props.site.freeToDive?.toString() || '',
    shoreAccess: props.site.shoreAccess?.toString() || '',
  };
}

function onLocationChanged(location: GpsCoordinates) {
  state.gps.lat = location.lat;
  state.gps.lon = location.lon;
}

async function onSave(): Promise<void> {
  isSaving.value = true;

  await oops(async () => {
    const dto = client.diveSites.wrapDTO(props.site);
    dto.name = state.name;
    dto.description = state.description || undefined;
    dto.depth =
      typeof state.depth.depth === 'number'
        ? {
            depth: state.depth.depth,
            unit: state.depth.unit,
            // bottomless: state.depth.bottomless,
          }
        : undefined;
    dto.location = state.location;
    dto.directions = state.directions || undefined;
    dto.gps = gps.value ?? undefined;
    dto.freeToDive =
      state.freeToDive === '' ? undefined : state.freeToDive === 'true';
    dto.shoreAccess =
      state.shoreAccess === '' ? undefined : state.shoreAccess === 'true';

    await dto.save();

    toasts.toast({
      id: 'site-updated',
      message: 'Dive site was successfully updated',
      type: ToastType.Success,
    });
    emit('site-updated', dto.toJSON());
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
  showConfirmCancelDialog.value = false;
}
</script>
