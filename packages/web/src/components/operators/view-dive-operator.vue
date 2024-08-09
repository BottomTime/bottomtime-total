<template>
  <div class="flex gap-6">
    <div>(logo)</div>

    <article class="space-y-3">
      <p
        v-if="operator.verified"
        class="bg-success rounded-full px-2 text-xl font-title flex items-baseline gap-2 w-fit"
      >
        <span>
          <i class="fa-solid fa-check"></i>
        </span>
        <span>Verified!</span>
      </p>

      <p class="text-lg">
        {{ operator.description }}
      </p>

      <div class="grid grid-cols-3 gap-4 text-center">
        <FormBox class="space-y-2">
          <TextHeading level="h3">Contact Info</TextHeading>
          <p>{{ operator.address }}</p>

          <p
            v-if="operator.phone"
            class="flex justify-center items-center gap-2"
          >
            <span>
              <i class="fa-solid fa-phone fa-xs"></i>
            </span>
            <span class="sr-only">Phone Number</span>
            <NavLink :to="phoneUri">{{ formattedPhone }}</NavLink>
          </p>

          <p
            v-if="operator.email"
            class="flex justify-center items-center gap-2"
          >
            <span>
              <i class="fa-solid fa-envelope fa-xs"></i>
            </span>
            <span class="sr-only">Email</span>
            <NavLink :to="`mailto:${operator.email}`">
              {{ operator.email }}
            </NavLink>
          </p>

          <p
            v-if="operator.website"
            class="flex justify-center items-center gap-2"
          >
            <span>
              <i class="fa-solid fa-globe fa-xs"></i>
            </span>
            <span class="sr-only">Website</span>
            <NavLink :to="operator.website" new-tab>
              {{ operator.website }}
            </NavLink>
          </p>
        </FormBox>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { DiveOperatorDTO } from '@bottomtime/api';

import { parsePhoneNumber } from 'libphonenumber-js';
import { computed } from 'vue';

import FormBox from '../common/form-box.vue';
import NavLink from '../common/nav-link.vue';
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
</script>
