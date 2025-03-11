<template>
  <li class="flex gap-3 items-center">
    <figure class="min-w-[64px] min-h-[64px]">
      <img :src="agency.logo" alt="" class="rounded-md" />
    </figure>

    <div class="flex flex-col grow">
      <div>
        <div class="flex gap-4 items-baseline">
          <a :id="slug" :href="`#${slug}`" @click="$emit('edit', agency)">
            <TextHeading level="h2">{{ agency.name }}</TextHeading>
          </a>

          <p v-if="agency.longName" class="text-lg italic">
            {{ agency.longName }}
          </p>
        </div>

        <p>
          <a :href="agency.website" target="_blank" class="space-x-1">
            <span>
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </span>
            <span>{{ agency.website }}</span>
          </a>
        </p>
      </div>
    </div>

    <div>
      <FormButton rounded="left" @click="$emit('edit', agency)">
        <span>
          <i class="fa-solid fa-pen"></i>
        </span>
        <span class="sr-only">Edit {{ agency.name }}</span>
      </FormButton>
      <FormButton
        type="danger"
        rounded="right"
        @click="$emit('delete', agency)"
      >
        <span>
          <i class="fa-solid fa-trash"></i>
        </span>
        <span class="sr-only">Delete {{ agency.name }}</span>
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { AgencyDTO } from '@bottomtime/api';

import slugify from 'slugify';
import { computed } from 'vue';

import FormButton from '../common/form-button.vue';
import TextHeading from '../common/text-heading.vue';

interface AgenciesListItemProps {
  agency: AgencyDTO;
}

const props = defineProps<AgenciesListItemProps>();
defineEmits<{
  (e: 'edit', agency: AgencyDTO): void;
  (e: 'delete', agency: AgencyDTO): void;
}>();

const slug = computed(() => slugify(props.agency.name.toLowerCase()));
</script>
