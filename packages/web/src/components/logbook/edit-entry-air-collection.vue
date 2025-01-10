<template>
  <ConfirmDialog
    :visible="state.showConfirmRemoveDialog"
    title="Remove Air Tank?"
    icon="fa-regular fa-circle-question fa-2xl"
    confirm-text="Remove"
    @confirm="onConfirmRemoveEntry"
    @cancel="onCancelRemoveEntry"
  >
    <p>Are you sure you want to remove the selected air tank?</p>
  </ConfirmDialog>

  <div class="space-y-2">
    <TransitionGroup name="list" tag="ul" class="space-y-3">
      <EditEntryAir
        v-for="(airEntry, index) in air"
        :key="airEntry.id"
        :air="airEntry"
        :tanks="tanks"
        :ordinal="index"
        @remove="onRemoveEntry"
        @update="(update) => $emit('update', update)"
      />
    </TransitionGroup>

    <div class="flex justify-center space-x-3">
      <FormButton
        control-id="btn-add-tank"
        test-id="btn-add-tank"
        @click="onAddTank"
      >
        <p class="space-x-1">
          <span>
            <i class="fa-solid fa-plus"></i>
          </span>
          <span>Add tank</span>
        </p>
      </FormButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO } from '@bottomtime/api';

import { v7 as uuid } from 'uuid';
import { reactive } from 'vue';

import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import { EditEntryAirFormData } from './edit-entry-air-form-data';
import EditEntryAir from './edit-entry-air.vue';

interface EditEntryAirCollectionProps {
  tanks: TankDTO[];
  air: EditEntryAirFormData[];
}

interface EditEntryAirCollectionState {
  showConfirmRemoveDialog: boolean;
  entryToRemove?: EditEntryAirFormData;
}

const BlankAirForm: EditEntryAirFormData = {
  id: '',
  startPressure: '',
  endPressure: '',
  count: '',
  pressureUnit: PressureUnit.Bar,
  hePercent: '',
  o2Percent: '',
  tankId: '',
} as const;

const currentUser = useCurrentUser();

const props = defineProps<EditEntryAirCollectionProps>();
const emit = defineEmits<{
  (e: 'add', air: EditEntryAirFormData): void;
  (e: 'remove', id: string): void;
  (e: 'update', air: EditEntryAirFormData): void;
}>();
const state = reactive<EditEntryAirCollectionState>({
  showConfirmRemoveDialog: false,
});

function onAddTank() {
  emit('add', {
    ...BlankAirForm,
    id: uuid(),
    pressureUnit: currentUser.user?.settings.pressureUnit ?? PressureUnit.Bar,
  });
}

function onRemoveEntry(id: string) {
  state.entryToRemove = props.air.find((entry) => entry.id === id);
  if (state.entryToRemove) state.showConfirmRemoveDialog = true;
}

function onCancelRemoveEntry() {
  state.entryToRemove = undefined;
  state.showConfirmRemoveDialog = false;
}

function onConfirmRemoveEntry() {
  if (state.entryToRemove) {
    emit('remove', state.entryToRemove.id);
  }
  state.showConfirmRemoveDialog = false;
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
