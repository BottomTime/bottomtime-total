<template>
  <li class="flex items-center gap-3">
    <figure class="min-w-[64px] min-h-[64px] text-center">
      <img
        v-if="operator.logo"
        class="rounded-lg"
        :src="`${operator.logo}/64x64`"
        width="64px"
        height="64px"
        alt=""
      />
      <i v-else class="fa-solid fa-image fa-3x"></i>
    </figure>

    <article class="grow space-y-2">
      <!-- Title -->
      <div class="flex gap-2 items-center">
        <a
          :id="operator.slug"
          :data-testid="`select-${operator.slug || operator.id}`"
          class="text-2xl capitalize"
          :href="`#${operator.slug}`"
          @click="$emit('select', operator)"
        >
          {{ operator.name }}
        </a>

        <PillLabel
          v-if="operator.verificationStatus === VerificationStatus.Verified"
          type="success"
        >
          <p class="space-x-2">
            <span>
              <i class="fa-solid fa-circle-check fa-sm"></i>
            </span>
            <span>Verified!</span>
          </p>
        </PillLabel>

        <template v-if="canEdit">
          <PillLabel
            v-if="operator.verificationStatus === VerificationStatus.Pending"
            type="info"
          >
            <p class="space-x-2">
              <span>
                <i class="fa-regular fa-clock"></i>
              </span>
              <span>Pending verification...</span>
            </p>
          </PillLabel>

          <PillLabel
            v-if="operator.verificationStatus === VerificationStatus.Rejected"
            type="danger"
          >
            <p class="space-x-2">
              <span>
                <i class="fa-solid fa-x"></i>
              </span>
              <span>Verification rejected</span>
            </p>
          </PillLabel>
        </template>
      </div>

      <MarkdownViewer
        v-if="operator.description"
        class="text-sm text-pretty"
        :model-value="operator.description"
        collapse
      />

      <address class="text-sm space-y-3">
        <div>
          <div v-if="operator.address || operator.gps" class="flex gap-2">
            <span>
              <i class="fa-solid fa-map-marker-alt"></i>
            </span>
            <label class="sr-only">Address</label>
            <p class="flex flex-col">
              <span v-if="operator.address">{{ operator.address }}</span>
              <span v-if="operator.gps">
                {{ `${operator.gps.lat}, ${operator.gps.lon}` }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap *:mr-6 items-baseline">
          <div v-if="operator.phone" class="flex gap-2">
            <span>
              <i class="fa-solid fa-phone"></i>
            </span>
            <label class="sr-only">Phone</label>
            <a :href="`tel:${operator.phone}`">{{ operator.phone }}</a>
          </div>

          <div v-if="operator.email" class="flex gap-2">
            <span>
              <i class="fa-solid fa-envelope"></i>
            </span>
            <label class="sr-only">Email</label>
            <a :ref="`mailto:${operator.email}`">{{ operator.email }}</a>
          </div>

          <div v-if="operator.website" class="flex gap-2">
            <span>
              <i class="fa-solid fa-globe"></i>
            </span>
            <label class="sr-only">Website</label>
            <a class="space-x-1" :href="operator.website" target="_blank">
              <span>{{ operator.website }}</span>
              <span>
                <i class="fa-solid fa-arrow-up-right-from-square fa-xs"></i>
              </span>
            </a>
          </div>
        </div>

        <div class="flex flex-wrap items-baseline *:mr-6">
          <div v-if="operator.socials?.facebook" class="flex gap-2">
            <span>
              <i class="fa-brands fa-facebook"></i>
            </span>
            <label class="sr-only">Facebook</label>
            <a
              :href="
                getSocialMediaProfileUrl(
                  SocialMediaNetwork.Facebook,
                  operator.socials?.facebook,
                )
              "
              target="_blank"
            >
              {{ operator.socials?.facebook }}
            </a>
          </div>

          <div v-if="operator.socials?.instagram" class="flex gap-2">
            <span>
              <i class="fa-brands fa-instagram"></i>
            </span>
            <label class="sr-only">Instagram</label>
            <a
              :href="
                getSocialMediaProfileUrl(
                  SocialMediaNetwork.Instagram,
                  operator.socials?.instagram,
                )
              "
              target="_blank"
            >
              {{ operator.socials?.instagram }}
            </a>
          </div>

          <div v-if="operator.socials?.tiktok" class="flex gap-2">
            <span>
              <i class="fa-brands fa-tiktok"></i>
            </span>
            <label class="sr-only">TikTok</label>
            <a
              :href="
                getSocialMediaProfileUrl(
                  SocialMediaNetwork.TikTok,
                  operator.socials?.tiktok,
                )
              "
              target="_blank"
            >
              {{ operator.socials?.tiktok }}
            </a>
          </div>

          <div v-if="operator.socials?.twitter" class="flex gap-2">
            <span>
              <i class="fa-brands fa-x-twitter"></i>
            </span>
            <label class="sr-only">X / Twitter</label>
            <a
              :href="
                getSocialMediaProfileUrl(
                  SocialMediaNetwork.Twitter,
                  operator.socials?.twitter,
                )
              "
              target="_blank"
            >
              {{ operator.socials?.twitter }}
            </a>
          </div>

          <div v-if="operator.socials?.youtube" class="flex gap-2">
            <span>
              <i class="fa-brands fa-youtube"></i>
            </span>
            <label class="sr-only">Youtube</label>
            <a
              :href="
                getSocialMediaProfileUrl(
                  SocialMediaNetwork.YouTube,
                  operator.socials?.youtube,
                )
              "
              target="_blank"
            >
              {{ operator.socials?.youtube }}
            </a>
          </div>
        </div>
      </address>
    </article>

    <div v-if="canEdit" class="flex px-2">
      <RouterLink :to="`/shops/${operator.slug}`">
        <FormButton
          rounded="left"
          size="sm"
          :test-id="`edit-${operator.slug || operator.id}`"
        >
          <p>
            <span class="sr-only">Edit {{ operator.name }}</span>
            <span>
              <i class="fa-solid fa-pen fa-sm"></i>
            </span>
          </p>
        </FormButton>
      </RouterLink>

      <FormButton
        rounded="right"
        size="sm"
        type="danger"
        :test-id="`delete-${operator.slug || operator.id}`"
        @click="$emit('delete', operator)"
      >
        <p>
          <span class="sr-only">Delete {{ operator.name }}</span>
          <span>
            <i class="fa-solid fa-trash fa-sm"></i>
          </span>
        </p>
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { OperatorDTO, UserRole, VerificationStatus } from '@bottomtime/api';

import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { SocialMediaNetwork, getSocialMediaProfileUrl } from '../../socials';
import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import MarkdownViewer from '../common/markdown-viewer.vue';
import PillLabel from '../common/pill-label.vue';

interface OperatorsListItemProps {
  operator: OperatorDTO;
}

const currentUser = useCurrentUser();

const props = defineProps<OperatorsListItemProps>();
defineEmits<{
  (e: 'select', operator: OperatorDTO): void;
  (e: 'delete', operator: OperatorDTO): void;
}>();
const canEdit = computed<boolean>(
  () =>
    currentUser.user?.role === UserRole.Admin ||
    currentUser.user?.id === props.operator.owner.userId,
);
</script>
