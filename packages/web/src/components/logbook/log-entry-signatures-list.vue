<template>
  <div>
    <p>
      <span>Showing </span>
      <span class="font-bold">{{ signatures.data.length }}</span>
      <span> of </span>
      <span class="font-bold">{{ signatures.totalCount }}</span>
      <span> signatures.</span>
    </p>
    <ul>
      <li
        v-if="signatures.data.length === 0"
        class="text-lg text-center italic space-x-2 my-3"
      >
        <span>
          <i class="fa-solid fa-circle-exclamation"></i>
        </span>
        <span>Noone has signed this log entry yet.</span>
      </li>

      <li
        v-for="signature in signatures.data"
        :key="signature.id"
        class="flex gap-3 p-2"
      >
        <figure>
          <UserAvatar :profile="signature.buddy" size="small" show-name />
        </figure>

        <div class="grow">
          <p class="font-bold">
            {{ getBuddyTypeString(signature.type) }}
          </p>
          <p
            v-if="signature.agency && signature.certificationNumber"
            class="font-mono text-xs"
          >
            {{ signature.agency.name }} #{{ signature.certificationNumber }}
          </p>
        </div>

        <div>
          {{ dayjs(signature.signedOn).format('LL') }}
        </div>

        <div v-if="editMode">
          <FormButton type="danger" @click="$emit('delete', signature)">
            <span>
              <i class="fa-solid fa-trash"></i>
            </span>
            <span class="sr-only">
              Delete signature from
              {{ signature.buddy.name || `@${signature.buddy.username}` }}
            </span>
          </FormButton>
        </div>
      </li>

      <li v-if="signatures.data.length < signatures.totalCount">
        <LoadingSpinner
          v-if="isLoadingMore"
          message="Fetching more signatures..."
        />
        <a v-else @click="$emit('load-more')">Load more...</a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ApiList, BuddyType, LogEntrySignatureDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';

import FormButton from '../common/form-button.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import UserAvatar from '../users/user-avatar.vue';

interface LogEntrySignaturesListProps {
  editMode?: boolean;
  isLoadingMore?: boolean;
  signatures: ApiList<LogEntrySignatureDTO>;
}

withDefaults(defineProps<LogEntrySignaturesListProps>(), {
  editMode: false,
  isLoadingMore: false,
});
defineEmits<{
  (e: 'load-more'): void;
  (e: 'delete', signature: LogEntrySignatureDTO): void;
}>();

function getBuddyTypeString(type: BuddyType): string {
  switch (type) {
    case BuddyType.Buddy:
      return 'Buddy';
    case BuddyType.Divemaster:
      return 'Dive Master';
    case BuddyType.Instructor:
      return 'Instructor';
  }
}
</script>
