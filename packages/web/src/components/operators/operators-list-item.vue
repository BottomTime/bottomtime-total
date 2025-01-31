<template>
  <li class="flex items-start gap-3">
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
        <FormButton
          type="link"
          size="2xl"
          :test-id="`select-${operator.slug || operator.id}`"
          @click="$emit('select', operator)"
        >
          <span class="capitalize">{{ operator.name }}</span>
        </FormButton>

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

      <p v-if="operator.description">
        {{ operator.description }}
      </p>

      <address class="grid grid-cols-2 px-2 gap-3 text-sm">
        <div class="space-y-1.5">
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

          <div v-if="operator.phone" class="flex gap-2">
            <span>
              <i class="fa-solid fa-phone"></i>
            </span>
            <label class="sr-only">Phone</label>
            <NavLink :to="`tel:${operator.phone}`">
              {{ operator.phone }}
            </NavLink>
          </div>

          <div v-if="operator.email" class="flex gap-2">
            <span>
              <i class="fa-solid fa-envelope"></i>
            </span>
            <label class="sr-only">Email</label>
            <NavLink :to="`mailto:${operator.email}`">
              {{ operator.email }}
            </NavLink>
          </div>

          <div v-if="operator.website" class="flex gap-2">
            <span>
              <i class="fa-solid fa-globe"></i>
            </span>
            <label class="sr-only">Website</label>
            <NavLink :to="operator.website">
              {{ operator.website }}
            </NavLink>
          </div>
        </div>

        <div class="space-y-1.5">
          <div v-if="operator.socials?.facebook" class="flex gap-2">
            <span>
              <i class="fa-brands fa-facebook"></i>
            </span>
            <label class="sr-only">Facebook</label>
            <NavLink
              :to="`https://facebook.com/${operator.socials?.facebook}/`"
              new-tab
            >
              {{ operator.socials?.facebook }}
            </NavLink>
          </div>

          <div v-if="operator.socials?.instagram" class="flex gap-2">
            <span>
              <i class="fa-brands fa-instagram"></i>
            </span>
            <label class="sr-only">Instagram</label>
            <NavLink
              :to="`https://instagram.com/${operator.socials?.instagram}/`"
              new-tab
            >
              {{ operator.socials?.instagram }}
            </NavLink>
          </div>

          <div v-if="operator.socials?.tiktok" class="flex gap-2">
            <span>
              <i class="fa-brands fa-tiktok"></i>
            </span>
            <label class="sr-only">TikTok</label>
            <NavLink
              :to="`https://tiktok.com/@${operator.socials?.tiktok}/`"
              new-tab
            >
              {{ operator.socials?.tiktok }}
            </NavLink>
          </div>

          <div v-if="operator.socials?.twitter" class="flex gap-2">
            <span>
              <i class="fa-brands fa-x-twitter"></i>
            </span>
            <label class="sr-only">X / Twitter</label>
            <NavLink
              :to="`https://x.com/${operator.socials?.twitter}/`"
              new-tab
            >
              {{ operator.socials?.twitter }}
            </NavLink>
          </div>

          <div v-if="operator.socials?.youtube" class="flex gap-2">
            <span>
              <i class="fa-brands fa-youtube"></i>
            </span>
            <label class="sr-only">Youtube</label>
            <NavLink
              :to="`https://youtube.com/@${operator.socials?.youtube}/`"
              new-tab
            >
              {{ operator.socials?.youtube }}
            </NavLink>
          </div>
        </div>
      </address>

      <div v-if="canEdit" class="flex px-2">
        <FormButton
          rounded="left"
          size="sm"
          :test-id="`edit-${operator.slug || operator.id}`"
          @click="$emit('select', operator)"
        >
          <p>
            <span class="sr-only">Edit {{ operator.name }}</span>
            <span>
              <i class="fa-solid fa-pen fa-sm"></i>
            </span>
          </p>
        </FormButton>
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
    </article>
  </li>
</template>

<script lang="ts" setup>
import { OperatorDTO, UserRole, VerificationStatus } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';
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
