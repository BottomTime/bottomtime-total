<template>
  <div class="flex gap-3">
    <figure class="min-w-[64px] min-h-[64px]">
      <img
        v-if="operator.logo"
        :src="operator.logo"
        alt=""
        class="w-[64px] h-[64px] rounded-full"
      />
    </figure>

    <article class="grow flex flex-col gap-4">
      <div class="flex justify-between">
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

      <div class="grid grid-cols-3 gap-4">
        <div>
          <span class="sr-only">Address</span>
          <p>{{ operator.address }}</p>
          <p v-if="operator.gps" class="space-x-1">
            <span class="text-danger">
              <i class="fa-solid fa-location-dot"></i>
            </span>
            <a
              class="text-sm font-mono"
              :href="`https://www.google.com/maps/search/?api=1&query=${operator.gps.lat},${operator.gps.lon}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ operator.gps.lat }}{{ operator.gps.lat > 0 ? 'N' : 'S' }},
              {{ operator.gps.lon }}{{ operator.gps.lon > 0 ? 'E' : 'W' }}
            </a>
          </p>
        </div>

        <div>
          <div v-if="operator.phone" class="space-x-1">
            <span>
              <i class="fa-solid fa-phone"></i>
            </span>
            <span class="sr-only">Phone</span>
            <a :href="`tel:${operator.phone}`">{{ operator.phone }}</a>
          </div>
        </div>

        <div>
          <p v-if="operator.email" class="space-x-1">
            <span>
              <i class="fa-solid fa-envelope"></i>
            </span>
            <span class="sr-only">Email</span>
            <a :href="`mailto:${operator.email}`">{{ operator.email }}</a>
          </p>
        </div>

        <div v-if="operator.socials?.facebook">
          <p class="space-x-1">
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
        </div>

        <div v-if="operator.socials?.instagram">
          <p class="space-x-1">
            <span>
              <i class="fa-brands fa-instagram"></i>
            </span>
            <span class="sr-only">Instagram</span>
            <a
              :href="operator.socials.instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ operator.socials.instagram }}
            </a>
          </p>
        </div>

        <div v-if="operator.socials?.tiktok">
          <p class="space-x-1">
            <span>
              <i class="fa-brands fa-tiktok"></i>
            </span>
            <span class="sr-only">TikTok</span>
            <a
              :href="operator.socials.tiktok"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ operator.socials.tiktok }}
            </a>
          </p>
        </div>

        <div v-if="operator.socials?.twitter">
          <p class="space-x-1">
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
        </div>

        <div v-if="operator.socials?.youtube">
          <p class="space-x-1">
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
    </article>
  </div>
</template>

<script lang="ts" setup>
import { OperatorDTO, VerificationStatus } from '@bottomtime/api';

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
