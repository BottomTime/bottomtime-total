<template>
  <ConfirmDialog
    title="Reset Profile?"
    :visible="showConfirmResetDialog"
    @confirm="onConfirmReset"
    @cancel="onCancelReset"
  >
    <div class="flex flex-row gap-4">
      <span class="pt-2">
        <i class="fas fa-question-circle fa-2x"></i>
      </span>
      <p>
        Are you sure you want to cancel the changes you have made to your
        profile?
      </p>
    </div>
  </ConfirmDialog>

  <ChangeAvatarDialog
    :avatar-url="data.avatar"
    :visible="showAvatarDialog"
    :is-saving="isSavingAvatar"
    @cancel="showAvatarDialog = false"
    @save="onAvatarChanged"
  />

  <form @submit.prevent="">
    <fieldset :disabled="isSaving">
      <div
        :class="`flex ${
          responsive ? 'flex-col lg:flex-row' : 'flex-col'
        } gap-3`"
      >
        <div
          :class="`${
            responsive ? 'min-w-[80px] flex-initial' : 'w-full text-center'
          }`"
        >
          <button
            class="flex flex-col space-y-3 p-3 items-center"
            @click="showAvatarDialog = !showAvatarDialog"
          >
            <UserAvatar
              :avatar="data.avatar"
              :display-name="user.profile.name || user.username"
              size="large"
              test-id="profile-avatar"
            />

            <span class="font-bold text-link underline hover:text-link-hover">
              Edit Avatar...
            </span>
          </button>
        </div>

        <div class="grow">
          <FormField>
            <TextHeading>Personal Info</TextHeading>
          </FormField>

          <FormField label="Name" control-id="name">
            <FormTextBox
              v-model.trim="data.name"
              control-id="name"
              test-id="nameInput"
              :maxlength="100"
              autofocus
            />
          </FormField>

          <FormField label="Location" control-id="location">
            <FormTextBox
              v-model.trim="data.location"
              control-id="location"
              test-id="locationInput"
              :maxlength="50"
            />
          </FormField>

          <FormField label="Birthdate" control-id="birthdate">
            <FormFuzzyDate
              v-model="data.birthdate"
              control-id="birthdate"
              test-id="birthdateInput"
              :max-year="new Date().getFullYear() - 6"
              :min-year="new Date().getFullYear() - 100"
            />
          </FormField>

          <FormField>
            <TextHeading class="mt-5">Bio</TextHeading>
          </FormField>
          <FormField control-id="bio">
            <FormTextArea
              v-model.trim="data.bio"
              control-id="bio"
              test-id="bioInput"
              :maxlength="500"
              :rows="6"
              resize="none"
            />
          </FormField>

          <FormField>
            <TextHeading class="mt-5">Dive Experience</TextHeading>
          </FormField>
          <FormField label="Experience level" control-id="experience-level">
            <FormSelect
              v-model.trim="data.experienceLevel"
              control-id="experience-level"
              test-id="experienceLevelInput"
              :options="ExperienceLevelOptions"
              stretch
            />
          </FormField>

          <FormField label="Started diving" control-id="started-diving">
            <FormFuzzyDate
              v-model="data.startedDiving"
              control-id="started-diving"
              test-id="startedDivingInput"
              :min-year="new Date().getFullYear() - 80"
            />
          </FormField>
        </div>
      </div>

      <div class="flex justify-center mt-6 gap-3">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          test-id="save-profile"
          submit
          @click="onSave"
        >
          Save Changes
        </FormButton>
        <FormButton test-id="cancel-profile" @click="onReset">
          Cancel
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script setup lang="ts">
import { ProfileDTO, UserDTO } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import { useClient } from '../../api-client';
import { Coordinates, SelectOption, ToastType } from '../../common';
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
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import UserAvatar from './user-avatar.vue';

type EditProfileProps = {
  responsive?: boolean;
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

const props = withDefaults(defineProps<EditProfileProps>(), {
  responsive: true,
});
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
const showConfirmResetDialog = ref(false);
const isSaving = ref(false);
const isSavingAvatar = ref(false);

const emit = defineEmits<{
  (e: 'save-profile', profile: ProfileDTO): void;
}>();

async function onAvatarChanged(file: File, coords: Coordinates) {
  isSavingAvatar.value = true;

  await oops(async () => {
    const { profile } = client.users.wrapDTO(props.user);

    const avatars = await profile.uploadAvatar(file, coords);
    emit('save-profile', {
      ...props.user.profile,
      avatar: avatars.root,
    });
    toasts.toast({
      id: 'avatar-uploaded',
      message: 'Avatar was successfully uploaded.',
      type: ToastType.Success,
    });
    showAvatarDialog.value = false;
  });

  isSavingAvatar.value = false;
}

async function onSave() {
  isSaving.value = true;

  await oops(async () => {
    const { profile } = client.users.wrapDTO(props.user);

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

function onReset() {
  showConfirmResetDialog.value = true;
}

function onConfirmReset() {
  data.avatar = props.user.profile.avatar ?? '';
  data.bio = props.user.profile.bio ?? '';
  data.birthdate = props.user.profile.birthdate ?? '';
  data.experienceLevel = props.user.profile.experienceLevel ?? '';
  data.location = props.user.profile.location ?? '';
  data.name = props.user.profile.name ?? '';
  data.startedDiving = props.user.profile.startedDiving ?? '';
  showConfirmResetDialog.value = false;
}

function onCancelReset() {
  showConfirmResetDialog.value = false;
}
</script>
