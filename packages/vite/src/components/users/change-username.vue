<template>
  <fieldset
    class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
    :disabled="isSaving"
  >
    <FormLabel
      class="lg:min-w-40 xl:min-w-48 lg:text-right"
      for="username"
      label="Username"
    />

    <div class="grow w-full">
      <div v-if="isEditing" class="flex flex-col gap-2">
        <FormTextBox
          ref="usernameInput"
          v-model.trim="usernameValue"
          control-id="username"
          test-id="username"
          select-on-focus
          :invalid="v$?.usernameValue?.$error"
          :maxlength="50"
          autofocus
          stretch
          @enter="onConfirm"
          @esc="onCancel"
        />
        <span v-if="v$?.usernameValue?.$error" class="text-danger text-sm">
          {{ v$?.usernameValue?.$errors[0]?.$message }}
        </span>
      </div>
      <span v-else>
        {{ username }}
      </span>
    </div>

    <div class="min-w-36 lg:min-w-40 xl:min-w-48">
      <div v-if="isEditing" class="flex flex-row gap-2 justify-stretch">
        <FormButton
          type="primary"
          test-id="save-username"
          :is-loading="isSaving"
          stretch
          @click="onConfirm"
        >
          Save
        </FormButton>
        <FormButton stretch @click="onCancel"> Cancel </FormButton>
      </div>

      <FormButton v-else stretch @click="onEdit">
        Change username...
      </FormButton>
    </div>
  </fieldset>
</template>

<script lang="ts" setup>
import { UsernameRegex } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import FormTextBox from '../common/form-text-box.vue';

type ChangeUsernameProps = {
  isEditing?: boolean;
  isSaving?: boolean;
  username: string;
};

const props = withDefaults(defineProps<ChangeUsernameProps>(), {
  isEditing: false,
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'editing', isEditing: boolean): void;
  (e: 'change', username: string): void;
}>();
const usernameInput = ref<InstanceType<typeof FormTextBox> | null>(null);
const usernameValue = ref(props.username);

const v$ = useVuelidate(
  {
    usernameValue: {
      required: helpers.withMessage('New username is required', required),
      regex: helpers.withMessage(
        'Username must be at least 3 characters and contain only letters, numbers, dashes, dots, and underscores',
        helpers.regex(UsernameRegex),
      ),
    },
  },
  { usernameValue },
);

function onEdit() {
  usernameValue.value = props.username;
  v$.value.$reset();
  emit('editing', true);
}

async function onConfirm(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) {
    usernameInput.value?.focus();
    return;
  }

  emit('change', usernameValue.value);
}

function onCancel() {
  emit('editing', false);
}
</script>
