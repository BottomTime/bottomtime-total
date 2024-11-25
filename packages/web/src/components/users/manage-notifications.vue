<template>
  <form @submit.prevent="onSave">
    <fieldset :disabled="state.isSaving">
      <TextHeading>Manage Notifications</TextHeading>

      <LoadingSpinner
        v-if="state.isLoading"
        class="mt-4 text-center"
        message="Fetching notification settings..."
      />

      <p
        v-else-if="state.loadingFailed"
        class="space-x-2 text-danger text-center my-4"
      >
        <span>
          <i class="fa-solid fa-triangle-exclamation"></i>
        </span>
        <span class="italic">
          An error occured while attempting to retrieve your notification
          settings. Please try again later.
        </span>
      </p>

      <div v-else class="mt-2">
        <div class="grid grid-cols-3">
          <p class="ml-2 font-bold text-xl font-title">Event</p>
          <p class="font-bold text-xl font-title">Email</p>
          <p class="font-bold text-xl font-title">Push Notification</p>
        </div>

        <div v-for="category in Object.keys(Categories)" :key="category">
          <p
            v-if="Categories[category].visible"
            class="ml-4 font-bold font-title text-lg"
          >
            {{ Categories[category].name }}
          </p>

          <ul>
            <li
              v-for="event in listEvents(category)"
              :key="event.key"
              class="grid grid-cols-3 py-1.5"
            >
              <p class="ml-6">{{ event.name }}</p>
              <p
                v-if="event.availability.has(NotificationType.Email)"
                class="text-center"
              >
                <FormCheckbox v-model="state.emailWhitelist[event.key]">
                  <span class="sr-only">
                    Enable email notifications for: {{ event.name }}
                  </span>
                </FormCheckbox>
              </p>
              <p
                v-if="event.availability.has(NotificationType.PushNotification)"
                class="text-center"
              >
                <FormCheckbox
                  v-model="state.pushNotificationWhitelist[event.key]"
                >
                  <span class="sr-only">
                    Enable push notifications for: {{ event.name }}
                  </span>
                </FormCheckbox>
              </p>
            </li>
          </ul>
        </div>
      </div>

      <div class="text-center space-x-3 mt-3">
        <FormButton
          type="primary"
          :is-loading="state.isSaving"
          submit
          @click="onSave"
        >
          Save Changes
        </FormButton>

        <FormButton>Cancel</FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { NotificationType, UserDTO } from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TextHeading from '../common/text-heading.vue';

type NotificationEventData = Record<
  EventKey,
  { name: string; availability: Set<NotificationType> }
>;
const Categories: Record<string, { name: string; visible: boolean }> = {
  user: { name: 'Account', visible: false },
  membership: { name: 'Membership', visible: true },
  friendRequest: { name: 'Friend Requests', visible: true },
};
const NotificationEvents: NotificationEventData = {
  [EventKey.FriendRequestAccepted]: {
    name: 'Friend request accepted',
    availability: new Set([
      NotificationType.Email,
      NotificationType.PushNotification,
    ]),
  },
  [EventKey.FriendRequestCreated]: {
    name: 'Friend request received',
    availability: new Set([
      NotificationType.Email,
      NotificationType.PushNotification,
    ]),
  },
  [EventKey.FriendRequestRejected]: {
    name: 'Friend request rejected',
    availability: new Set([
      NotificationType.Email,
      NotificationType.PushNotification,
    ]),
  },
  [EventKey.MembershipCanceled]: {
    name: 'Membership canceled',
    availability: new Set([NotificationType.Email]),
  },
  [EventKey.MembershipChanged]: {
    name: 'Membership changed',
    availability: new Set([NotificationType.Email]),
  },
  [EventKey.MembershipCreated]: {
    name: 'Membership created',
    availability: new Set([NotificationType.Email]),
  },
  [EventKey.MembershipInvoiceCreated]: {
    name: 'Membership invoice created',
    availability: new Set([NotificationType.Email]),
  },
  [EventKey.MembershipPaymentFailed]: {
    name: 'Membership payment issue',
    availability: new Set([NotificationType.Email]),
  },
  [EventKey.MembershipTrialEnding]: {
    name: 'Membership trial ending',
    availability: new Set([NotificationType.Email]),
  },
  [EventKey.UserCreated]: {
    name: 'Account created',
    availability: new Set(),
  },
  [EventKey.UserPasswordResetRequest]: {
    name: 'Password reset request',
    availability: new Set(),
  },
  [EventKey.UserVerifyEmailRequest]: {
    name: 'Email verification request',
    availability: new Set(),
  },
} as const;
type WhitelistState = Record<EventKey, boolean>;

interface ManageNotificationsProps {
  user: UserDTO;
}
interface ManageNotificationsState {
  isLoading: boolean;
  isSaving: boolean;
  loadingFailed: boolean;
  emailWhitelist: WhitelistState;
  pushNotificationWhitelist: WhitelistState;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<ManageNotificationsProps>();
const state = reactive<ManageNotificationsState>({
  isLoading: true,
  loadingFailed: false,
  isSaving: false,
  emailWhitelist: {
    [EventKey.FriendRequestAccepted]: false,
    [EventKey.FriendRequestCreated]: false,
    [EventKey.FriendRequestRejected]: false,
    [EventKey.MembershipCanceled]: false,
    [EventKey.MembershipChanged]: false,
    [EventKey.MembershipCreated]: false,
    [EventKey.MembershipInvoiceCreated]: false,
    [EventKey.MembershipPaymentFailed]: false,
    [EventKey.MembershipTrialEnding]: false,
    [EventKey.UserCreated]: false,
    [EventKey.UserPasswordResetRequest]: false,
    [EventKey.UserVerifyEmailRequest]: false,
  },
  pushNotificationWhitelist: {
    [EventKey.FriendRequestAccepted]: false,
    [EventKey.FriendRequestCreated]: false,
    [EventKey.FriendRequestRejected]: false,
    [EventKey.MembershipCanceled]: false,
    [EventKey.MembershipChanged]: false,
    [EventKey.MembershipCreated]: false,
    [EventKey.MembershipInvoiceCreated]: false,
    [EventKey.MembershipPaymentFailed]: false,
    [EventKey.MembershipTrialEnding]: false,
    [EventKey.UserCreated]: false,
    [EventKey.UserPasswordResetRequest]: false,
    [EventKey.UserVerifyEmailRequest]: false,
  },
});

function listEvents(category: string): {
  key: EventKey;
  name: string;
  availability: Set<NotificationType>;
}[] {
  return Object.values(EventKey)
    .filter(
      (event) =>
        event.startsWith(category) &&
        NotificationEvents[event].availability.size,
    )
    .map((event) => ({
      key: event,
      name: NotificationEvents[event].name,
      availability: NotificationEvents[event].availability,
    }));
}

function parseWhitelist(state: WhitelistState, whitelist: string[]) {
  Object.keys(state).forEach((key) => {
    state[key as EventKey] = false;
  });

  for (const whitelisted of whitelist) {
    const parts = whitelisted.split('.');
    if (parts[parts.length - 1] === '*') {
      while (parts.length > 0) {
        parts.pop();
        const prefix = parts.join('.');
        for (const key of Object.values(EventKey)) {
          if (key.startsWith(prefix)) {
            state[key] = true;
          }
        }
        break;
      }
      parts.pop();
    } else {
      state[whitelisted as EventKey] = true;
    }
  }
}

function condenseWhitelist(state: WhitelistState): string[] {
  if (Object.values(state).every((value) => value)) {
    return ['*'];
  }

  const whitelist = new Array<string>();
  for (const category of Object.keys(Categories)) {
    const keys = Object.values(EventKey).filter((key) =>
      key.startsWith(category),
    );
    if (keys.every((key) => state[key])) {
      whitelist.push(`${category}.*`);
    } else {
      keys.forEach((key) => {
        if (state[key]) {
          whitelist.push(key);
        }
      });
    }
  }

  return whitelist;
}

async function refreshWhitelists(): Promise<void> {
  state.isLoading = true;

  await oops(
    async () => {
      const user = client.users.wrapDTO(props.user);
      const whitelists = await user.settings.getNotificationWhitelists();
      parseWhitelist(state.emailWhitelist, whitelists.email);
      parseWhitelist(
        state.pushNotificationWhitelist,
        whitelists.pushNotification,
      );
    },
    {
      default: () => {
        state.loadingFailed = true;
      },
    },
  );

  state.isLoading = false;
}

onMounted(refreshWhitelists);

async function onSave(): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const user = client.users.wrapDTO(props.user);
    const emailWhitelist = condenseWhitelist(state.emailWhitelist);
    const pushNotificationWhitelist = condenseWhitelist(
      state.pushNotificationWhitelist,
    );
    await Promise.all([
      user.settings.updateNotificationWhitelist(
        NotificationType.Email,
        emailWhitelist,
      ),
      user.settings.updateNotificationWhitelist(
        NotificationType.PushNotification,
        pushNotificationWhitelist,
      ),
    ]);

    toasts.toast({
      id: 'notifications-saved',
      message: 'Notification settings saved successfully.',
      type: ToastType.Success,
    });
  });

  state.isSaving = false;
}
</script>
