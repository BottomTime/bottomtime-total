<template>
  <div class="space-y-2">
    <FormBox class="flex justify-between items-baseline">
      <p class="text-lg" data-testid="tanks-list-counts">
        <span>Showing </span>
        <span class="font-bold">{{ tanks.tanks.length }}</span>
        <span> tank profile(s)</span>
      </p>

      <FormButton
        v-if="showAddTank"
        type="primary"
        control-id="tanks-list-add"
        test-id="tanks-list-add"
        @click="$emit('add')"
      >
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

      <li
        v-if="tanks.tanks.length === 0"
        class="justify-center my-6 text-lg italic flex gap-3"
        data-testid="tanks-list-empty"
      >
        <p>
          <i class="fa-solid fa-circle-info"></i>
        </p>
        <p>
          <span>You have not created any tank profiles yet. Click </span>
          <FormButton size="lg" type="link" @click="$emit('add')">
            here
          </FormButton>
          <span> to create your first tank profile.</span>
        </p>
      </li>
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
  showAddTank?: boolean;
}

withDefaults(defineProps<TanksListProps>(), {
  showAddTank: true,
});
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
