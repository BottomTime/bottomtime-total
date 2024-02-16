<template>
  <div
    class="grid grid-cols-3 text-center mb-6"
    data-testid="account-timestamps"
  >
    <div class="flex flex-col">
      <label class="font-bold">Joined</label>
      <span>
        {{ formatTime(user.memberSince) }}
      </span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Last Login</label>
      <span>
        {{ formatTime(user.lastLogin) }}
      </span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Last Password Change</label>
      <span>
        {{ formatTime(user.lastPasswordChange) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UserDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';
import 'dayjs/plugin/utc';

type AccountTimestampsProps = {
  user: UserDTO;
  exactTimes?: boolean;
};

const props = withDefaults(defineProps<AccountTimestampsProps>(), {
  exactTimes: false,
});

function formatTime(time?: Date) {
  if (!time) return 'Never';
  return props.exactTimes
    ? dayjs(time).utc().format('MMM D, YYYY H:mm:ss (UTC)')
    : dayjs(time).fromNow();
}
</script>
