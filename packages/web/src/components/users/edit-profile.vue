<template>
  <ConfirmDialog
    title="Reset Profile?"
    icon="fas fa-question-circle fa-2x"
    :visible="showConfirmResetDialog"
    @confirm="onConfirmReset"
    @cancel="onCancelReset"
  >
    <p>
      Are you sure you want to cancel the changes you have made to your profile?
    </p>
  </ConfirmDialog>

  <ConfirmDialog
    title="Delete Avatar?"
    icon="fas fa-question-circle fa-2x"
    :visible="showDeleteAvatarDialog"
    dangerous
    @confirm="onConfirmDeleteAvatar"
    @cancel="onCancelDeleteAvatar"
  >
    <p>
      Are you sure you want to delete your avatar picture? This cannot be
      undone.
    </p>
  </ConfirmDialog>

  <UploadImageDialog
    ref="changeAvatarDialog"
    :avatar-url="state.avatar"
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
            data-testid="btn-change-avatar"
            class="flex flex-col space-y-3 items-center w-full"
            @click="onEditAvatar"
          >
            <UserAvatar
              :avatar="state.avatar"
              :display-name="profile.name || profile.username"
              size="large"
              test-id="profile-avatar"
            />

            <span class="font-bold text-link underline hover:text-link-hover">
              {{ state.avatar ? 'Edit Avatar...' : 'Upload avatar...' }}
            </span>
          </button>

          <button
            v-if="state.avatar"
            data-testid="btn-delete-avatar"
            class="flex flex-col space-y-3 items-center w-full"
            @click="onDeleteAvatar"
          >
            <span class="font-bold text-link underline hover:text-link-hover">
              Delete Avatar...
            </span>
          </button>
        </div>

        <div class="grow space-y-3">
          <TextHeading>Personal Info</TextHeading>
          <FormField label="Name" control-id="name">
            <FormTextBox
              v-model.trim="state.name"
              control-id="name"
              test-id="nameInput"
              :maxlength="100"
              autofocus
            />
          </FormField>

          <FormField label="Location" control-id="location">
            <FormTextBox
              v-model.trim="state.location"
              control-id="location"
              test-id="locationInput"
              :maxlength="50"
            />
          </FormField>

          <FormField
            label="Share my logbook with"
            control-id="logbook-sharing"
            :help="LogbookSharingHelp"
            required
          >
            <FormSelect
              v-model="state.logBookSharing"
              control-id="logbook-sharing"
              test-id="logBookSharingInput"
              :options="LogbookSharingOptions"
              stretch
            />
          </FormField>

          <TextHeading class="mt-5">Dive Experience</TextHeading>
          <FormField label="Experience level" control-id="experience-level">
            <FormSelect
              v-model.trim="state.experienceLevel"
              control-id="experience-level"
              test-id="experienceLevelInput"
              :options="ExperienceLevelOptions"
              stretch
            />
          </FormField>

          <FormField label="Started diving" control-id="started-diving">
            <FormFuzzyDate
              v-model="state.startedDiving"
              control-id="started-diving"
              test-id="startedDivingInput"
              :min-year="new Date().getFullYear() - 80"
            />
          </FormField>

          <TextHeading class="mt-5">Bio</TextHeading>
          <FormField control-id="bio">
            <FormTextArea
              v-model.trim="state.bio"
              control-id="bio"
              test-id="bioInput"
              :maxlength="500"
              :rows="6"
              resize="none"
            />
          </FormField>

          <div v-if="tanks" data-testid="tank-profiles">
            <TextHeading>Personal Tank Profiles</TextHeading>
            <div v-if="tanks.totalCount" class="space-y-5">
              <p>
                <span>You currently have </span>
                <span class="font-bold">{{ tanks.totalCount }}</span>
                <span> personal tank profile(s) defined:</span>
              </p>

              <div class="m-4 space-y-4">
                <p class="text-lg italic">
                  {{ tanks.data.map((tank) => `"${tank.name}"`).join(', ') }}
                </p>
                <NavLink :to="`/profile/${profile.username}/tanks`">
                  Manage Tank Profiles...
                </NavLink>
              </div>
            </div>

            <div v-else class="text-lg italic my-4">
              <span>You haven't created any personal tank profiles yet. </span>
              <NavLink :to="`/profile/${props.profile.username}/tanks`">
                Click here
              </NavLink>
              <span> to create one.</span>
            </div>
          </div>
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
import { ApiList, LogBookSharing, ProfileDTO, TankDTO } from '@bottomtime/api';

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
import NavLink from '../common/nav-link.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import UploadImageDialog from '../dialog/upload-image-dialog.vue';
import UserAvatar from './user-avatar.vue';

interface EditProfileProps {
  responsive?: boolean;
  profile: ProfileDTO;
  tanks?: ApiList<TankDTO>;
}

interface EditProfileState {
  avatar: string;
  bio: string;
  experienceLevel: string;
  location: string;
  logBookSharing: LogBookSharing;
  name: string;
  startedDiving: string;
}

const LogbookSharingHelp =
  'This will determine who can view your log book records. You can keep your log book private by ("Just me"), make it visible to only your friends ("Me and my friends"), or make it public ("Everyone"). Only you will be able to modify your log book.';

const ExperienceLevelOptions: SelectOption[] = [
  { label: '(unspecified)', value: '' },
  { value: 'Beginner' },
  { value: 'Novice' },
  { value: 'Experienced' },
  { value: 'Expert' },
];

const LogbookSharingOptions: SelectOption[] = [
  { label: 'Just me', value: LogBookSharing.Private },
  { label: 'Me and my friends', value: LogBookSharing.FriendsOnly },
  { label: 'Everyone', value: LogBookSharing.Public },
];

const client = useClient();
const toasts = useToasts();
const oops = useOops();

const props = withDefaults(defineProps<EditProfileProps>(), {
  responsive: true,
});

const state = reactive<EditProfileState>({
  avatar: props.profile.avatar ?? '',
  bio: props.profile.bio ?? '',
  experienceLevel: props.profile.experienceLevel ?? '',
  location: props.profile.location ?? '',
  logBookSharing: props.profile.logBookSharing ?? LogBookSharing.Private,
  name: props.profile.name ?? '',
  startedDiving: props.profile.startedDiving ?? '',
});
const showAvatarDialog = ref(false);
const showConfirmResetDialog = ref(false);
const showDeleteAvatarDialog = ref(false);
const isSaving = ref(false);
const isSavingAvatar = ref(false);

const changeAvatarDialog = ref<InstanceType<typeof UploadImageDialog> | null>(
  null,
);

const emit = defineEmits<{
  (e: 'save-profile', profile: ProfileDTO): void;
}>();

function onEditAvatar() {
  if (changeAvatarDialog.value) {
    changeAvatarDialog.value.reset();
  }
  showAvatarDialog.value = true;
}

async function onAvatarChanged(file: File, coords: Coordinates) {
  isSavingAvatar.value = true;

  await oops(async () => {
    const profile = client.users.wrapProfileDTO(props.profile);

    const avatars = await profile.uploadAvatar(file, coords);
    state.avatar = avatars.root;
    emit('save-profile', {
      ...props.profile,
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
    const profile = client.users.wrapProfileDTO(props.profile);

    profile.bio = state.bio || undefined;
    profile.experienceLevel = state.experienceLevel || undefined;
    profile.location = state.location || undefined;
    profile.logBookSharing = state.logBookSharing;
    profile.name = state.name || undefined;
    profile.startedDiving = state.startedDiving || undefined;

    await profile.save();

    emit('save-profile', {
      ...props.profile,
      avatar: state.avatar || undefined,
      bio: state.bio || undefined,
      experienceLevel: state.experienceLevel || undefined,
      location: state.location || undefined,
      logBookSharing: state.logBookSharing,
      name: state.name || undefined,
      startedDiving: state.startedDiving || undefined,
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
  state.bio = props.profile.bio ?? '';
  state.experienceLevel = props.profile.experienceLevel ?? '';
  state.location = props.profile.location ?? '';
  state.logBookSharing = props.profile.logBookSharing ?? LogBookSharing.Private;
  state.name = props.profile.name ?? '';
  state.startedDiving = props.profile.startedDiving ?? '';
  showConfirmResetDialog.value = false;
}

function onCancelReset() {
  showConfirmResetDialog.value = false;
}

function onDeleteAvatar() {
  showDeleteAvatarDialog.value = true;
}

async function onConfirmDeleteAvatar(): Promise<void> {
  await oops(async () => {
    const profile = client.users.wrapProfileDTO(props.profile);
    await profile.deleteAvatar();

    state.avatar = '';
    emit('save-profile', {
      ...props.profile,
      avatar: undefined,
    });
    toasts.toast({
      id: 'avatar-deleted',
      message: 'Avatar was successfully deleted.',
      type: ToastType.Success,
    });
  });
  showDeleteAvatarDialog.value = false;
}

function onCancelDeleteAvatar() {
  showDeleteAvatarDialog.value = false;
}
</script>
