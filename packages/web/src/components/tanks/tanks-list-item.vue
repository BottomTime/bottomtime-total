<template>
  <li
    class="flex justify-between items-baseline even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
    :data-testid="`tank-${tank.id}`"
  >
    <div class="space-y-2">
      <button
        class="font-title font-bold text-xl hover:text-link-hover"
        :data-testid="`select-tank-${tank.id}`"
        @click="$emit('select', tank)"
      >
        {{ tank.name }}
      </button>

      <div class="flex items-baseline">
        <p class="min-w-40 space-x-2">
          <span class="font-bold text-lg">Material:</span>
          <span class="font-mono text-sm dark:text-grey-300">
            {{ material }}
          </span>
        </p>

        <p class="min-w-40 space-x-2 text-center">
          <span class="font-bold text-lg">Volume:</span>
          <span class="font-mono text-sm dark:text-grey-300">
            {{ tank.volume }} L
          </span>
        </p>

        <p class="min-w-40 space-x-2 text-right">
          <span class="font-bold text-lg">Max Pressure:</span>
          <span class="font-mono text-sm dark:text-grey-300">
            {{ tank.workingPressure }} bar
          </span>
        </p>
      </div>
    </div>

    <FormButton
      type="danger"
      :data-testid="`delete-tank-${tank.id}`"
      @click="$emit('delete', tank)"
    >
      <p>
        <span>
          <i class="fa-solid fa-trash-can"></i>
        </span>
        <span class="sr-only">Delete tank: {{ tank.name }}</span>
      </p>
    </FormButton>
  </li>
</template>

<script lang="ts" setup>
import { TankDTO, TankMaterial } from '@bottomtime/api';

import { computed } from 'vue';

import FormButton from '../common/form-button.vue';

interface TanksListItemProps {
  tank: TankDTO;
}

const props = defineProps<TanksListItemProps>();
defineEmits<{
  (e: 'select', tank: TankDTO): void;
  (e: 'delete', tank: TankDTO): void;
}>();

const material = computed(() =>
  props.tank.material === TankMaterial.Aluminum ? 'Aluminum' : 'Steel',
);
</script>
