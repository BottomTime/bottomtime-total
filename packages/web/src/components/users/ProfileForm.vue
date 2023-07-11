<template>
  <form id="profile-form" class="box" @submit.prevent="() => {}">
    <ConfirmDialog
      confirm-text="Discard changes"
      title="Discard Changes?"
      :visible="showConfirmCancel"
      dangerous
      @cancel="cancelDiscardChanges"
      @confirm="confirmDiscardChanges"
    >
      <p class="content">Hello there</p>
    </ConfirmDialog>
    <nav class="level">
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Username</p>
          <p class="title is-size-5">{{ profile.username }}</p>
        </div>
      </div>

      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Member Since</p>
          <p class="title is-size-5">{{ memberSince }}</p>
        </div>
      </div>
    </nav>

    <FormField label="Name" control-id="name">
      <TextBox id="name" v-model.trim="data.name" />
    </FormField>

    <FormField label="Location" control-id="location">
      <TextBox id="location" v-model.trim="data.location" />
    </FormField>

    <FormField label="Experience level" control-id="experienceLevel">
      <DropDown
        id="experienceLevel"
        v-model="data.experienceLevel"
        :options="ExperienceLevelOptions"
      />
    </FormField>

    <FormField label="Birthdate">
      <FuzzyDatePicker id="birthdate" v-model="data.birthdate" />
    </FormField>

    <FormField label="Started Diving">
      <FuzzyDatePicker id="startedDiving" v-model="data.startedDiving" />
    </FormField>

    <FormField label="Bio" control-id="bio">
      <TextArea id="bio" v-model.trim="data.bio" :maxlength="1000" />
    </FormField>

    <FormField label="Profile visibility" control-id="profileVisibility">
      <DropDown
        id="profileVisibility"
        v-model="data.profileVisibility"
        :options="ProfileVisibilityOptions"
      />
    </FormField>

    <div class="field is-grouped is-grouped-centered">
      <div class="control">
        <button class="button is-primary" @click="saveChanges">
          Save Changes
        </button>
      </div>
      <div class="control">
        <button class="button" @click="discardChanges">Cancel</button>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import dayjs from 'dayjs';

import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import DropDown from '@/components/forms/DropDown.vue';
import FormField from '@/components/forms/FormField.vue';
import FuzzyDatePicker from '@/components/forms/FuzzyDatePicker.vue';
import { Toast, ToastType, inject } from '@/helpers';
import TextArea from '@/components/forms/TextArea.vue';
import TextBox from '@/components/forms/TextBox.vue';
import { Profile } from '@/users';
import { ProfileVisibilityOptions } from '@/constants';
import { DropDownOption } from '@/constants';
import { WithErrorHandlingKey } from '@/injection-keys';
import { Dispatch, useStore } from '@/store';

interface ProfileFormData {
  bio: string;
  birthdate: string;
  experienceLevel: string;
  location: string;
  name: string;
  profileVisibility: string;
  startedDiving: string;
}

interface ProfileFormProps {
  profile: Profile;
}

const SaveSuccessToast: Toast = {
  id: 'profile-save-success',
  type: ToastType.Success,
  message: 'Your profile information has been saved.',
};

const ExperienceLevelOptions: DropDownOption[] = [
  { value: '', text: '(select)' },
  { value: 'Beginner' },
  { value: 'Novice' },
  { value: 'Casual' },
  { value: 'Experienced' },
  { value: 'Expert' },
  { value: 'Professional' },
];

const store = useStore();
const withErrorHandler = inject(WithErrorHandlingKey);

const props = defineProps<ProfileFormProps>();
const emit = defineEmits<{
  (e: 'saved'): void;
}>();
const data = reactive<ProfileFormData>({
  bio: props.profile.bio ?? '',
  birthdate: props.profile.birthdate ?? '',
  experienceLevel: props.profile.experienceLevel ?? '',
  location: props.profile.location ?? '',
  name: props.profile.name ?? '',
  profileVisibility: props.profile.profileVisibility,
  startedDiving: props.profile.startedDiving ?? '',
});

const memberSince = computed(() => dayjs(props.profile.memberSince).fromNow());
const showConfirmCancel = ref(false);

async function saveChanges() {
  await withErrorHandler(async () => {
    const { profile } = props;
    profile.bio = data.bio;
    profile.birthdate = data.birthdate;
    profile.experienceLevel = data.experienceLevel;
    profile.location = data.location;
    profile.name = data.name;
    profile.profileVisibility = data.profileVisibility;
    profile.startedDiving = data.startedDiving;

    await profile.save();
    await store.dispatch(Dispatch.Toast, SaveSuccessToast);

    emit('saved');
  });
}

function discardChanges() {
  showConfirmCancel.value = true;
}

function confirmDiscardChanges() {
  const { profile } = props;
  data.bio = profile.bio ?? '';
  data.birthdate = profile.birthdate ?? '';
  data.experienceLevel = profile.experienceLevel ?? '';
  data.location = profile.location ?? '';
  data.name = profile.name ?? '';
  data.profileVisibility = profile.profileVisibility;
  data.startedDiving = profile.startedDiving ?? '';
  showConfirmCancel.value = false;
}

function cancelDiscardChanges() {
  showConfirmCancel.value = false;
}
</script>
