<template>
  <li
    class="flex items-center gap-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="w-[64px] h-[64px]">
      <img class="rounded-lg" :src="operator.logo" alt="" />
    </div>

    <article class="space-y-1">
      <div class="flex gap-2 align-top">
        <FormButton
          type="link"
          size="2xl"
          :test-id="`select-${operator.slug || operator.id}`"
          @click="$emit('select', operator)"
        >
          <span class="capitalize">{{ operator.name }}</span>
        </FormButton>

        <div class="relative group">
          <p v-if="operator.verified" class="text-sm text-success space-x-1">
            <span>
              <i class="fa-solid fa-circle-check fa-sm"></i>
            </span>
            <span
              class="absolute invisible group-hover:visible transition-opacity left-[105%] top-0 bg-success text-grey-950 px-2 rounded-md"
            >
              Verified!
            </span>
          </p>
        </div>
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
    </article>

    <div class="flex min-w-32">
      <FormButton v-if="false" rounded="left" size="sm">
        <p>
          <span class="sr-only">Edit {{ operator.name }}</span>
          <span>
            <i class="fa-solid fa-edit fa-sm"></i>
          </span>
        </p>
      </FormButton>
      <FormButton v-if="false" rounded="right" size="sm" type="danger">
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
import { DiveOperatorDTO } from '@bottomtime/api';

import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';

interface DiveOperatorsListItemProps {
  operator: DiveOperatorDTO;
}

defineProps<DiveOperatorsListItemProps>();
defineEmits<{
  (e: 'select', operator: DiveOperatorDTO): void;
}>();
</script>
