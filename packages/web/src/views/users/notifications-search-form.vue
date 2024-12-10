<template>
  <FormBox class="sticky top-16">
    <form @submit.prevent="">
      <fieldset class="space-y-3" :disabled="isLoading">
        <TextHeading>Search Options</TextHeading>

        <FormField control-id="showDismissed">
          <FormCheckbox
            v-model="state.showDismissed"
            control-id="showDismissed"
            test-id="showDismissed"
          >
            Show "read" notifications
          </FormCheckbox>
        </FormField>

        <div class="text-center">
          <FormButton
            control-id="btn-search"
            test-id="btn-search"
            :is-loading="isLoading"
            submit
            @click="onSearch"
          >
            Refresh
          </FormButton>
        </div>
      </fieldset>
    </form>
  </FormBox>
</template>

<script lang="ts" setup>
import { ListNotificationsParamsDTO } from '@bottomtime/api';

import { reactive, watch } from 'vue';

import FormBox from '../../components/common/form-box.vue';
import FormButton from '../../components/common/form-button.vue';
import FormCheckbox from '../../components/common/form-checkbox.vue';
import FormField from '../../components/common/form-field.vue';
import TextHeading from '../../components/common/text-heading.vue';

interface NotificationsSearchFormState {
  showDismissed: boolean;
}

interface NotificationsSearchFormProps {
  isLoading?: boolean;
  searchOptions: ListNotificationsParamsDTO;
}

const props = withDefaults(defineProps<NotificationsSearchFormProps>(), {
  isLoading: false,
});
const emit = defineEmits<{
  (e: 'search', options: ListNotificationsParamsDTO): void;
}>();

const state = reactive<NotificationsSearchFormState>({
  showDismissed: false,
});

function onSearch() {
  emit('search', {
    ...props.searchOptions,
    showDismissed: state.showDismissed,
  });
}

watch(
  () => props.searchOptions,
  (options) => {
    state.showDismissed = options.showDismissed ?? false;
  },
  { immediate: true },
);
</script>
