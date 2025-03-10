<template>
  <li class="flex items-center gap-3">
    <figure class="rounded-full">
      <img :src="association.agency.logo" class="w-[64px] h-[64px]" />
    </figure>

    <div class="flex flex-col gap-2 grow">
      <a
        :id="`a-${association.id}`"
        :href="`#a-${association.id}`"
        class="flex items-baseline gap-3"
        @click="$emit('edit', association)"
      >
        <span class="text-2xl font-bold">
          {{ association.agency.name }} - {{ association.title }}
        </span>
        <span class="text-lg font-mono"
          >#{{ association.identificationNumber }}</span
        >
      </a>
      <p v-if="association.startDate" class="space-x-2">
        <span class="font-bold">Since:</span>
        <span>{{ association.startDate }}</span>
      </p>
    </div>

    <div>
      <FormButton
        rounded="left"
        :test-id="`edit-assoc-${association.id}`"
        @click="$emit('edit', association)"
      >
        <span>
          <i class="fa-solid fa-pen"></i>
        </span>
        <span class="sr-only">
          Edit {{ association.agency.name }} {{ association.title }} #{{
            association.identificationNumber
          }}
        </span>
      </FormButton>
      <FormButton
        rounded="right"
        type="danger"
        :test-id="`delete-assoc-${association.id}`"
        @click="$emit('delete', association)"
      >
        <span>
          <i class="fa-solid fa-trash"></i>
        </span>
        <span class="sr-only">
          Delete {{ association.agency.name }} {{ association.title }} #{{
            association.identificationNumber
          }}
        </span>
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { ProfessionalAssociationDTO } from '@bottomtime/api';

import FormButton from '../common/form-button.vue';

interface ProfessionalAssociationListItemProps {
  association: ProfessionalAssociationDTO;
}

defineProps<ProfessionalAssociationListItemProps>();
defineEmits<{
  (e: 'edit', association: ProfessionalAssociationDTO): void;
  (e: 'delete', association: ProfessionalAssociationDTO): void;
}>();
</script>
