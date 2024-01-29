<template>
  <img class="rounded-full w-8 h-8" alt="" :src="avatar" />
</template>

<script setup lang="ts">
import { UserDTO } from '@bottomtime/api';
import { computed } from 'vue';

type UserAvatarProps = {
  user: UserDTO;
};

const props = defineProps<UserAvatarProps>();
const avatar = computed(
  () =>
    props.user.profile?.avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      props.user.profile?.name ?? props.user.username,
    )}`,
);
</script>
