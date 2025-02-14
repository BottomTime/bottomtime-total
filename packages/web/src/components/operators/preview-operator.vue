<template>
  <div class="flex flex-col xl:flex-row gap-2 items-center">
    <figure class="min-w-[64px] min-h-[64px]">
      <img
        v-if="operator.logo"
        :src="operator.logo"
        alt=""
        class="w-[64px] h-[64px] rounded-full"
      />
    </figure>

    <article class="grow flex flex-col gap-4">
      <div class="flex flex-col lg:flex-row justify-between items-center">
        <div class="flex gap-2 items-center">
          <button
            class="font-title text-xl capitalize hover:text-link-hover"
            @click="$emit('select', operator)"
          >
            {{ operator.name }}
          </button>

          <a :href="`/shops/${operator.slug}`" target="_blank">
            <span>
              <i class="fa-solid fa-up-right-from-square fa-sm"></i>
            </span>
            <span class="sr-only">
              Open dive shop "{{ operator.name }}" in new tab
            </span>
          </a>

          <PillLabel
            v-if="operator.verificationStatus === VerificationStatus.Verified"
            type="success"
            class="space-x-1"
          >
            <span>
              <i class="fa-solid fa-check"></i>
            </span>
            <span>Verified</span>
          </PillLabel>
        </div>

        <StarRating :value="operator.averageRating" readonly />
      </div>

      <div class="grid grid-cols-4 gap-1.5 text-sm">
        <label class="font-bold text-right">Address:</label>
        <!-- <div class="text-center col-span-2 lg:col-span-2">
          <label class="font-bold">Address</label> -->
        <div class="text-pretty col-span-3">
          <AddressText :address="operator.address" />
          <a
            v-if="operator.gps"
            :href="`https://www.google.com/maps/search/?api=1&query=${operator.gps.lat},${operator.gps.lon}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GpsCoordinatesText :coordinates="operator.gps" />
          </a>
        </div>

        <label class="font-bold space-x-1 text-right">
          <span>
            <i class="fa-solid fa-phone"></i>
          </span>
          <span>Phone:</span>
        </label>
        <p class="col-span-3">
          <a v-if="operator.phone" :href="`tel:${operator.phone}`">
            {{ operator.phone }}
          </a>
          <span v-else>Unspecified</span>
        </p>

        <label class="font-bold space-x-1 text-right">
          <span>
            <i class="fa-solid fa-envelope"></i>
          </span>
          <span>Email:</span>
        </label>
        <p class="col-span-3">
          <a v-if="operator.email" :href="`mailto:${operator.email}`">
            {{ operator.email }}
          </a>
          <span v-else>Unspecified</span>
        </p>

        <label class="font-bold text-right">Socials:</label>
        <div class="flex flex-wrap *:mr-3 col-span-3">
          <p v-if="operator.socials?.facebook" class="space-x-1">
            <span>
              <i class="fa-brands fa-facebook"></i>
            </span>
            <span class="sr-only">Facebook</span>
            <a
              :href="operator.socials.facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ operator.socials.facebook }}
            </a>
          </p>

          <p v-if="operator.socials?.instagram" class="space-x-1">
            <span>
              <i class="fa-brands fa-instagram"></i>
            </span>
            <span class="sr-only">Instagram</span>
            <a
              :href="operator.socials.instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              @{{ operator.socials.instagram }}
            </a>
          </p>

          <p v-if="operator.socials?.tiktok" class="space-x-1">
            <span>
              <i class="fa-brands fa-tiktok"></i>
            </span>
            <span class="sr-only">TikTok</span>
            <a
              :href="operator.socials.tiktok"
              target="_blank"
              rel="noopener noreferrer"
            >
              @{{ operator.socials.tiktok }}
            </a>
          </p>

          <p v-if="operator.socials?.twitter" class="space-x-1">
            <span>
              <i class="fa-brands fa-x-twitter"></i>
            </span>
            <span class="sr-only">Twitter / X</span>
            <a
              :href="operator.socials.twitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ operator.socials.twitter }}
            </a>
          </p>

          <p v-if="operator.socials?.youtube" class="space-x-1">
            <span>
              <i class="fa-brands fa-youtube"></i>
            </span>
            <span class="sr-only">YouTube</span>
            <a
              :href="operator.socials.youtube"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ operator.socials.youtube }}
            </a>
          </p>
        </div>
      </div>

      <div class="text-center"></div>
    </article>
  </div>
</template>

<script lang="ts" setup>
import { OperatorDTO, VerificationStatus } from '@bottomtime/api';

import AddressText from '../common/address-text.vue';
import GpsCoordinatesText from '../common/gps-coordinates-text.vue';
import PillLabel from '../common/pill-label.vue';
import StarRating from '../common/star-rating.vue';

interface PreviewOperatorProps {
  operator: OperatorDTO;
}

defineProps<PreviewOperatorProps>();
defineEmits<{
  (e: 'select', operator: OperatorDTO): void;
}>();
</script>
