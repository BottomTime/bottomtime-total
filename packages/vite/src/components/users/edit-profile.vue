<template>
  <ChangeAvatarDialog
    :avatar-url="data.avatar"
    :display-name="data.name || profile.username"
    :visible="showAvatarDialog"
    @cancel="showAvatarDialog = false"
    @save="onAvatarChanged"
  />
  <form @submit.prevent="">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <TextHeading>Personal Info</TextHeading>
        <FormField label="Name" control-id="name">
          <FormTextBox
            v-model.trim="data.name"
            control-id="name"
            :maxlength="100"
            autofocus
          />
        </FormField>

        <FormField label="Location" control-id="location">
          <FormTextBox
            v-model.trim="data.location"
            control-id="location"
            :maxlength="50"
          />
        </FormField>

        <FormField label="Birthdate" control-id="birthdate">
          <FormFuzzyDate
            v-model="data.birthdate"
            control-id="birthdate"
            :max-year="new Date().getFullYear() - 6"
            :min-year="new Date().getFullYear() - 100"
          />
        </FormField>

        <FormField label="Bio" control-id="bio">
          <FormTextArea
            v-model.trim="data.bio"
            control-id="bio"
            :maxlength="500"
            :rows="6"
            resize="none"
          />
        </FormField>
      </div>

      <div>
        <div class="w-full flex justify-center mb-4">
          <button @click="showAvatarDialog = !showAvatarDialog">
            <UserAvatar
              :avatar="data.avatar"
              :display-name="data.name || profile.username"
              size="x-large"
            />
          </button>
        </div>

        <TextHeading>Dive Experience</TextHeading>
        <FormField label="Experience level" control-id="experience-level">
          <FormSelect
            v-model.trim="data.experienceLevel"
            control-id="experience-level"
            :options="ExperienceLevelOptions"
            stretch
          />
        </FormField>

        <FormField label="Started diving" control-id="started-diving">
          <FormFuzzyDate
            v-model="data.startedDiving"
            control-id="started-diving"
            :min-year="new Date().getFullYear() - 80"
          />
        </FormField>
      </div>
    </div>
    <div class="flex justify-center mt-6 gap-3">
      <FormButton type="primary" submit>Save Changes</FormButton>
      <FormButton>Reset Changes</FormButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ProfileDTO } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import { SelectOption } from '../../common';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormFuzzyDate from '../common/form-fuzzy-date.vue';
import FormSelect from '../common/form-select.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import TextHeading from '../common/text-heading.vue';
import ChangeAvatarDialog from '../dialog/change-avatar-dialog.vue';
import UserAvatar from './user-avatar.vue';

type EditProfileProps = {
  profile: ProfileDTO;
};
type ProfileData = {
  avatar: string;
  bio: string;
  birthdate: string;
  experienceLevel: string;
  location: string;
  name: string;
  startedDiving: string;
};

const ExperienceLevelOptions: SelectOption[] = [
  { label: '(unspecified)', value: '' },
  { value: 'Beginner' },
  { value: 'Novice' },
  { value: 'Experienced' },
  { value: 'Expert' },
];

const props = defineProps<EditProfileProps>();
const data = reactive<ProfileData>({
  avatar: props.profile.avatar ?? '',
  bio: props.profile.bio ?? '',
  birthdate: props.profile.birthdate ?? '',
  experienceLevel: props.profile.experienceLevel ?? '',
  location: props.profile.location ?? '',
  name: props.profile.name ?? '',
  startedDiving: props.profile.startedDiving ?? '',
});
const showAvatarDialog = ref(false);

function onAvatarChanged(avatarUrl: string | undefined) {
  data.avatar = avatarUrl ?? '';
  showAvatarDialog.value = false;
}
</script>
