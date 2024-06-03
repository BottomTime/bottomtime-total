<template>
  <div class="space-y-2">
    <TransitionGroup name="list" tag="ul">
      <EditEntryAir
        v-for="(airEntry, index) in air"
        :key="airEntry.id"
        :air="airEntry"
        :tanks="tanks"
        :ordinal="index"
        @remove="(id) => $emit('remove', id)"
        @update="(update) => $emit('update', update)"
      />
    </TransitionGroup>

    <FormButton type="link" @click="onAddTank">
      <p class="space-x-1">
        <span>
          <i class="fa-solid fa-plus"></i>
        </span>
        <span>Add tank</span>
      </p>
    </FormButton>
  </div>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO } from '@bottomtime/api';

import { v4 as uuid } from 'uuid';

import FormButton from '../common/form-button.vue';
import { EditEntryAirFormData } from './edit-entry-air-form-data';
import EditEntryAir from './edit-entry-air.vue';

interface EditEntryAirCollectionProps {
  tanks: TankDTO[];
  air: EditEntryAirFormData[];
}

const BlankAirForm: EditEntryAirFormData = {
  id: '',
  startPressure: '',
  endPressure: '',
  count: '',
  pressureUnit: PressureUnit.Bar,
  hePercentage: '',
  o2Percentage: '',
  tankId: '',
} as const;

defineProps<EditEntryAirCollectionProps>();
const emit = defineEmits<{
  (e: 'add', air: EditEntryAirFormData): void;
  (e: 'remove', id: string): void;
  (e: 'update', air: EditEntryAirFormData): void;
}>();

function onAddTank() {
  emit('add', { ...BlankAirForm, id: uuid() });
}
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
