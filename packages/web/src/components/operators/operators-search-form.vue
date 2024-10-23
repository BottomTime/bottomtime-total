<template>
  <FormBox>
    <form class="flex flex-col gap-4" @submit.prevent="">
      <TextHeading level="h3">Search</TextHeading>

      <FormField label="Search query">
        <FormSearchBox
          v-model.trim="state.query"
          control-id="operator-search"
          :maxlength="200"
          placeholder="Search dive shops"
          test-id="operator-search"
          autofocus
          @search="onSearch"
        />
      </FormField>

      <FormField label="Location">
        <FormLocationSelect
          v-model="state.gps"
          test-id="operator-location"
          show-radius
        />
      </FormField>

      <FormField v-if="allowFilterMyShops" label="Options">
        <div class="space-y-2">
          <FormCheckbox
            v-model="state.onlyOwnedShops"
            control-id="operator-show-mine"
            test-id="operator-show-mine"
          >
            Show only my shops
          </FormCheckbox>

          <FormCheckbox
            v-model="state.showInactive"
            control-id="operator-show-inactive"
            test-id="operator-show-inactive"
          >
            Show inactive
          </FormCheckbox>
        </div>
      </FormField>

      <div class="text-center">
        <FormButton
          control-id="btn-operator-search"
          test-id="btn-operator-search"
          :submit="true"
          @click="onSearch"
        >
          <div class="space-x-2">
            <span>
              <i class="fa-solid fa-magnifying-glass"></i>
            </span>
            <span>Search</span>
          </div>
        </FormButton>
      </div>
    </form>
  </FormBox>
</template>

<script lang="ts" setup>
import {
  AccountTier,
  GpsCoordinates,
  GpsCoordinatesWithRadius,
  SearchOperatorsParams,
  UserRole,
} from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import FormField from '../common/form-field.vue';
import FormLocationSelect from '../common/form-location-select.vue';
import FormSearchBox from '../common/form-search-box.vue';
import TextHeading from '../common/text-heading.vue';

interface OperatorsSearchProps {
  searchParams: SearchOperatorsParams;
}

interface OperatorsSearchFormState {
  gps?: GpsCoordinates | GpsCoordinatesWithRadius;
  onlyOwnedShops: boolean;
  query: string;
  showInactive: boolean;
}

const currentUser = useCurrentUser();
const props = defineProps<OperatorsSearchProps>();

const state = reactive<OperatorsSearchFormState>({
  gps: props.searchParams.location
    ? {
        ...props.searchParams.location,
        radius: props.searchParams.radius,
      }
    : undefined,
  onlyOwnedShops: props.searchParams.owner === currentUser.user?.username,
  query: props.searchParams.query || '',
  showInactive: props.searchParams.showInactive ?? false,
});
const emit = defineEmits<{
  (e: 'search', params: SearchOperatorsParams): void;
}>();

const allowFilterMyShops = computed(
  () =>
    !!currentUser.user &&
    (currentUser.user.role === UserRole.Admin ||
      currentUser.user.accountTier >= AccountTier.ShopOwner),
);

function onSearch() {
  emit('search', {
    ...props.searchParams,
    query: state.query || undefined,
    owner: state.onlyOwnedShops ? currentUser.user?.username : undefined,
    location: state.gps
      ? { lat: state.gps.lat, lon: state.gps.lon }
      : undefined,
    radius: state.gps && 'radius' in state.gps ? state.gps.radius : undefined,
    showInactive: state.showInactive,
  });
}
</script>
