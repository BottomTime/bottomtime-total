<template>
  <li
    class="flex items-center gap-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="w-[64px] h-[64px]">
      <img class="rounded-lg" :src="operator.logo" alt="" />
    </div>

    <article class="space-y-1">
      <FormButton
        type="link"
        size="2xl"
        :test-id="`select-${operator.slug || operator.id}`"
      >
        <span class="capitalize">{{ operator.name }}</span>
      </FormButton>

      <p v-if="operator.description">
        {{ operator.description }}
      </p>

      <address class="flex justify-between px-2 text-sm">
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <span>
              <i class="fa-solid fa-map-marker-alt"></i>
            </span>
            <label class="sr-only">Address</label>
            <p class="flex flex-col">
              <span>{{ operator.address }}</span>
              <span v-if="operator.gps">
                {{ `${operator.gps.lat}, ${operator.gps.lon}` }}
              </span>
            </p>
          </div>

          <div class="flex gap-2">
            <span>
              <i class="fa-solid fa-phone"></i>
            </span>
            <label class="sr-only">Phone</label>
            <NavLink :to="`tel:${operator.phone}`">
              {{ operator.phone }}
            </NavLink>
          </div>

          <div class="flex gap-2">
            <span>
              <i class="fa-solid fa-envelope"></i>
            </span>
            <label class="sr-only">Email</label>
            <NavLink :to="`mailto:${operator.email}`">
              {{ operator.email }}
            </NavLink>
          </div>

          <div class="flex gap-2">
            <span>
              <i class="fa-solid fa-globe"></i>
            </span>
            <label class="sr-only">Website</label>
            <NavLink :to="operator.website">
              {{ operator.website }}
            </NavLink>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
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

          <div class="flex gap-2">
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

          <div class="flex gap-2">
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

          <div class="flex gap-2">
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
        </div>
      </address>
    </article>

    <div class="flex">
      <FormButton rounded="left" size="sm">
        <p>
          <span class="sr-only">Edit {{ operator.name }}</span>
          <span>
            <i class="fa-solid fa-edit fa-sm"></i>
          </span>
        </p>
      </FormButton>
      <FormButton rounded="right" size="sm" type="danger">
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
</script>
