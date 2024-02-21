<template>
  <FormBox>
    <div>
      <FormButton
        type="link"
        :test-id="`select-site-${site.id}`"
        @click="$emit('site-selected', site)"
      >
        <h1 class="text-2xl font-bold">{{ site.name }}</h1>
      </FormButton>
    </div>
    {{ JSON.stringify(site) }}
  </FormBox>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';

type DiveSitesListItemProps = {
  site: DiveSiteDTO;
};

defineProps<DiveSitesListItemProps>();
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();
</script>
