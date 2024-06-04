<template>
  <div class="space-y-2">
    <FormBox class="flex justify-between items-baseline">
      <p class="text-lg">
        <span>Showing </span>
        <span class="font-bold">{{ tanks.totalCount }}</span>
        <span> tank profiles</span>
      </p>

      <FormButton type="primary" @click="$emit('add')">
        <p class="space-x-1.5">
          <span>
            <i class="fa-solid fa-plus"></i>
          </span>
          <span>Create New Tank</span>
        </p>
      </FormButton>
    </FormBox>
    <TransitionGroup name="list" tag="ul">
      <TanksListItem
        v-for="tank in tanks.tanks"
        :key="tank.id"
        :tank="tank"
        @select="$emit('select', tank)"
        @delete="$emit('delete', tank)"
      />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { ListTanksResponseDTO, TankDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import TanksListItem from './tanks-list-item.vue';

interface TanksListProps {
  tanks: ListTanksResponseDTO;
}

defineProps<TanksListProps>();
defineEmits<{
  (e: 'add'): void;
  (e: 'delete', tank: TankDTO): void;
  (e: 'select', tank: TankDTO): void;
}>();
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
