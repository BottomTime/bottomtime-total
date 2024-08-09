<template>
  <div class="space-y-3">
    <FormBox class="flex justify-between items-baseline">
      <p>
        <span>Showing </span>
        <span>{{ operators.operators.length }}</span>
        <span> of </span>
        <span>{{ operators.totalCount }}</span>
        <span> dive operators</span>
      </p>

      <div>
        <a href="/createShop">
          <FormButton type="primary">Add a Dive Shop</FormButton>
        </a>
      </div>
    </FormBox>

    <ul class="px-2">
      <DiveOperatorsListItem
        v-for="operator in operators.operators"
        :key="operator.slug"
        :operator="operator"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { SearchDiveOperatorsResponseDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import DiveOperatorsListItem from './dive-operators-list-item.vue';

interface DiveOperatorsListProps {
  operators: SearchDiveOperatorsResponseDTO;
}

defineProps<DiveOperatorsListProps>();
</script>
