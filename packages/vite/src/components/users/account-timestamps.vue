<template>
  <div class="grid grid-cols-3 text-center mb-6">
    <div class="flex flex-col">
      <label class="font-bold">Joined</label>
      <span class="italic">
        {{ formatTime(user.memberSince) }}
      </span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Last Login</label>
      <span class="italic">
        {{ formatTime(user.lastLogin) }}
      </span>
    </div>

    <div class="flex flex-col">
      <label class="font-bold">Last Password Change</label>
      <span class="italic">
        {{ formatTime(user.lastPasswordChange) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UserDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';

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
    ? dayjs(time).format('MMMM D, YYYY h:mm:ss A')
    : dayjs(time).fromNow();
}
</script>
