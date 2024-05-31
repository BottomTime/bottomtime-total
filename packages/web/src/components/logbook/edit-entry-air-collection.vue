<template>
  <div class="space-y-2">
    <TransitionGroup name="list" tag="ul">
      <EditEntryAir
        v-for="(airEntry, index) in airEntries"
        :key="index"
        :air="airEntry"
        :tanks="tanks"
        :ordinal="index"
        @remove="(index) => $emit('remove', index)"
        @update="(update, index) => $emit('update', update, index)"
      />
    </TransitionGroup>

    <FormButton type="link" size="sm" @click="onAddTank">
      <p class="text-sm space-x-1">
        <span>
          <i class="fa-solid fa-plus fa-sm"></i>
        </span>
        <span>Add tank</span>
      </p>
    </FormButton>

    <p>{{ JSON.stringify(airEntries) }}</p>
  </div>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import { EditEntryAirFormData } from './edit-entry-air-form-data';
import EditEntryAir from './edit-entry-air.vue';

interface EditEntryAirCollectionProps {
  tanks: TankDTO[];
  air: EditEntryAirFormData[];
}

const BlankAirForm: EditEntryAirFormData = {
  startPressure: '',
  endPressure: '',
  count: '',
  pressureUnit: PressureUnit.Bar,
  hePercentage: '',
  o2Percentage: '',
  tankId: '',
} as const;

const props = defineProps<EditEntryAirCollectionProps>();
const airEntries = reactive<EditEntryAirFormData[]>([...props.air]);
defineEmits<{
  (e: 'remove', index: number): void;
  (e: 'update', air: EditEntryAirFormData, index: number): void;
}>();

function onAddTank() {
  airEntries.push({ ...BlankAirForm });
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
