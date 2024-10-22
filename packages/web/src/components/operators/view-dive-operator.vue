<template>
  <div class="flex gap-6" data-testid="view-operator-section">
    <div>
      <p v-if="operator.logo" class="p-2">
        <img
          :src="operator.logo"
          class="rounded-md"
          width="256px"
          height="256px"
        />
      </p>
    </div>

    <article class="space-y-3">
      <PillLabel
        v-if="operator.verificationStatus === VerificationStatus.Verified"
        type="success"
        class="text-xl"
        data-testid="operator-verified"
      >
        <span>
          <i class="fa-solid fa-check"></i>
        </span>
        <span>Verified!</span>
      </PillLabel>

      <p class="text-lg">
        {{ operator.description }}
      </p>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2 px-3">
          <TextHeading level="h3">Contact Info</TextHeading>

          <p class="space-x-2">
            <span>
              <i class="fa-solid fa-map-marker-alt fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Address</span>
            <span>{{ operator.address }}</span>
          </p>

          <p v-if="operator.phone" class="space-x-2">
            <span>
              <i class="fa-solid fa-phone fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Phone Number</span>
            <NavLink :to="phoneUri">{{ formattedPhone }}</NavLink>
          </p>

          <p v-if="operator.email" class="space-x-2">
            <span>
              <i class="fa-solid fa-envelope fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Email</span>
            <NavLink :to="`mailto:${operator.email}`">
              {{ operator.email }}
            </NavLink>
          </p>

          <p v-if="operator.website" class="space-x-2">
            <span>
              <i class="fa-solid fa-globe fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Website</span>
            <NavLink :to="operator.website" new-tab>
              {{ operator.website }}
            </NavLink>
          </p>
        </div>

        <div v-if="showSocials" class="space-y-2 px-3">
          <TextHeading level="h3">Socials</TextHeading>

          <p v-if="operator.socials?.facebook" class="space-x-2">
            <span>
              <i class="fa-brands fa-facebook fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Facebook</span>
            <NavLink
              :to="`https://facebook.com/${operator.socials.facebook}/`"
              new-tab
            >
              {{ operator.socials.facebook }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.instagram" class="space-x-2">
            <span>
              <i class="fa-brands fa-instagram fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">Instagram</span>
            <NavLink
              :to="`https://instagram.com/${operator.socials.instagram}/`"
              new-tab
            >
              {{ operator.socials.instagram }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.tiktok" class="space-x-2">
            <span>
              <i class="fa-brands fa-tiktok fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">TikTok</span>
            <NavLink
              :to="`https://tiktok.com/@${operator.socials.tiktok}/`"
              new-tab
            >
              {{ operator.socials.tiktok }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.twitter" class="space-x-2">
            <span>
              <i class="fa-brands fa-x-twitter fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">X</span>
            <NavLink :to="`https://x.com/${operator.socials.twitter}/`" new-tab>
              {{ operator.socials.twitter }}
            </NavLink>
          </p>

          <p v-if="operator.socials?.youtube" class="space-x-2">
            <span>
              <i class="fa-brands fa-youtube fa-xs fa-fw"></i>
            </span>
            <span class="sr-only">YouTube</span>
            <NavLink
              :to="`https://youtube.com/channel/${operator.socials.youtube}/`"
              new-tab
            >
              {{ operator.socials.youtube }}
            </NavLink>
          </p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { DiveOperatorDTO, VerificationStatus } from '@bottomtime/api';

import { parsePhoneNumber } from 'libphonenumber-js';
import { computed } from 'vue';

import NavLink from '../common/nav-link.vue';
import PillLabel from '../common/pill-label.vue';
import TextHeading from '../common/text-heading.vue';

interface ViewDiveOperatorProps {
  operator: DiveOperatorDTO;
}

const props = defineProps<ViewDiveOperatorProps>();

const phoneUri = computed(() =>
  props.operator.phone
    ? parsePhoneNumber(props.operator.phone, 'US').getURI()
    : '',
);
const formattedPhone = computed(() =>
  props.operator.phone
    ? parsePhoneNumber(props.operator.phone, 'US').formatInternational()
    : '',
);
const showSocials = computed(
  () =>
    props.operator.socials?.facebook ||
    props.operator.socials?.instagram ||
    props.operator.socials?.tiktok ||
    props.operator.socials?.twitter ||
    props.operator.socials?.youtube,
);
</script>
