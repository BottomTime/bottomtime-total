<template>
  <FormBox class="sticky top-20">
    <FormSearchBox v-model="state.query" autofocus />
  </FormBox>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

import FormBox from '../common/form-box.vue';
import FormSearchBox from '../common/form-search-box.vue';

interface LogbookSearchState {
  query: string;
}

const state = reactive<LogbookSearchState>({
  query: '',
});
</script>
