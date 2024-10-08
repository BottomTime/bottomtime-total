<template>
  <FormBox>
    <form class="flex flex-col gap-4" @submit.prevent="onSearch">
      <TextHeading level="h3">Search</TextHeading>

      <FormField label="Search query">
        <FormTextBox v-model="state.query" :autofocus="true" />
      </FormField>

      <FormField>
        <FormCheckbox v-if="currentUser.user" v-model="state.onlyOwnedShops">
          Show only my shops
        </FormCheckbox>
      </FormField>

      <div class="text-center">
        <FormButton :submit="true">
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
import { SearchDiveOperatorsParams } from '@bottomtime/api';

import { reactive } from 'vue';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import TextHeading from '../common/text-heading.vue';

interface OperatorsSearchProps {
  searchParams: SearchDiveOperatorsParams;
}

interface OperatorsSearchState {
  query: string;
  onlyOwnedShops: boolean;
}

const currentUser = useCurrentUser();
const props = defineProps<OperatorsSearchProps>();

const state = reactive<OperatorsSearchState>({
  query: props.searchParams.query || '',
  onlyOwnedShops: props.searchParams.owner === currentUser.user?.username,
});
const emit = defineEmits<{
  (e: 'search', params: SearchDiveOperatorsParams): void;
}>();

function onSearch() {
  emit('search', {
    ...props.searchParams,
    query: state.query || undefined,
    owner: state.onlyOwnedShops ? currentUser.user?.username : undefined,
  });
}
</script>
