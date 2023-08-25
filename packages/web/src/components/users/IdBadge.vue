<template>
  <RouterLink :to="`/profile/${username}`">
    <div class="card">
      <div class="card-header">
        <p class="card-header-title">
          {{ `@${username}` }}
        </p>
      </div>
      <div class="card-content">
        <article class="media">
          <figure class="media-left image is-64x64">
            <img class="is-rounded" :src="avatarUrl" />
          </figure>

          <div class="media-content">
            <p v-if="displayName !== username" class="content">
              {{ displayName }}
            </p>
            <p class="content is-size-7">Joined {{ memberSince }}</p>
          </div>
        </article>
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import dayjs from 'dayjs';

interface IdBadgeProps {
  id: string;
  avatar?: string;
  displayName: string;
  username: string;
  memberSince: Date;
}

const props = defineProps<IdBadgeProps>();

const memberSince = computed(() => dayjs(props.memberSince).fromNow());
const avatarUrl = computed(
  () =>
    props.avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(props.displayName)}`,
);
</script>
