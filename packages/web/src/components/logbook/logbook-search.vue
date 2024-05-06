<template>
  <FormBox class="sticky top-20 flex flex-col gap-3" shadow>
    <form @submit.prevent="onSearch">
      <FormField>
        <FormSearchBox
          v-model="state.query"
          control-id="searchQuery"
          test-id="search-query"
          autofocus
          @search="onSearch"
        />
      </FormField>

      <FormField label="Start date" :responsive="false">
        <FormDatePicker
          v-model="state.startDate"
          control-id="searchStartDate"
          mode="date"
          placeholder="Show entries after..."
        />
      </FormField>

      <FormField label="End date" :responsive="false">
        <FormDatePicker
          v-model="state.endDate"
          control-id="searchEndDate"
          mode="date"
          placeholder="Show entries before..."
        />
      </FormField>

      <div class="text-center">
        <FormButton test-id="btn-search" submit @click="onSearch">
          Search
        </FormButton>
      </div>
    </form>
  </FormBox>
</template>

<script lang="ts" setup>
import { ListLogEntriesParamsDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSearchBox from '../common/form-search-box.vue';

interface LogbookSearchProps {
  params: ListLogEntriesParamsDTO;
}

interface LogbookSearchState {
  query: string;
  startDate?: Date;
  endDate?: Date;
}

const props = defineProps<LogbookSearchProps>();
const state = reactive<LogbookSearchState>({
  query: props.params.query ?? '',
  startDate: props.params.startDate,
  endDate: props.params.endDate,
});

const emit = defineEmits<{
  (e: 'search', options: ListLogEntriesParamsDTO): void;
}>();

function onSearch() {
  emit('search', {
    query: state.query,
    startDate: state.startDate,
    endDate: state.endDate,
  });
}
</script>
