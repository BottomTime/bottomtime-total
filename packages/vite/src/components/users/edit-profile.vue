<template>
  <ChangeAvatarDialog
    :avatar-url="data.avatar"
    :display-name="data.name || user.username"
    :visible="showAvatarDialog"
    @cancel="showAvatarDialog = false"
    @save="onAvatarChanged"
  />
  <form @submit.prevent="">
    <fieldset :disabled="isSaving">
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
                :display-name="data.name || user.username"
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
        <FormButton
          type="primary"
          :is-loading="isSaving"
          submit
          @click="onSave"
        >
          Save Changes
        </FormButton>
        <FormButton @click="onCancel">Cancel</FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { ProfileDTO, UserDTO } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import { useClient } from '../../client';
import { SelectOption, ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
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
  user: UserDTO;
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

const client = useClient();
const toasts = useToasts();
const oops = useOops();

const props = defineProps<EditProfileProps>();
const data = reactive<ProfileData>({
  avatar: props.user.profile.avatar ?? '',
  bio: props.user.profile.bio ?? '',
  birthdate: props.user.profile.birthdate ?? '',
  experienceLevel: props.user.profile.experienceLevel ?? '',
  location: props.user.profile.location ?? '',
  name: props.user.profile.name ?? '',
  startedDiving: props.user.profile.startedDiving ?? '',
});
const showAvatarDialog = ref(false);
const isSaving = ref(false);

const emit = defineEmits<{
  (e: 'save-profile', profile: ProfileDTO): void;
}>();

function onAvatarChanged(avatarUrl: string | undefined) {
  data.avatar = avatarUrl ?? '';
  showAvatarDialog.value = false;
}

async function onSave() {
  isSaving.value = true;

  await oops(async () => {
    const { profile } = client.users.wrapDTO(props.user);

    profile.avatar = data.avatar || undefined;
    profile.bio = data.bio || undefined;
    profile.birthdate = data.birthdate || undefined;
    profile.experienceLevel = data.experienceLevel || undefined;
    profile.location = data.location || undefined;
    profile.name = data.name || undefined;
    profile.startedDiving = data.startedDiving || undefined;

    await profile.save();

    emit('save-profile', {
      ...props.user.profile,
      avatar: data.avatar || undefined,
      bio: data.bio || undefined,
      birthdate: data.birthdate || undefined,
      experienceLevel: data.experienceLevel || undefined,
      location: data.location || undefined,
      name: data.name || undefined,
      startedDiving: data.startedDiving || undefined,
    });
    toasts.toast({
      id: 'profile-saved',
      message: 'Profile info was successfully saved.',
      type: ToastType.Success,
    });
  });

  isSaving.value = false;
}

function onCancel() {}
</script>
