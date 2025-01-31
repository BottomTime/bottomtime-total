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

  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700/40 to-blue-500/40 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Breathing Gas</TextHeading>

    <FormField>
      <TransitionList inverted>
        <EditEntryAir
          v-for="(airEntry, index) in formData"
          :key="airEntry.id"
          :air="airEntry"
          :tanks="tanks"
          :ordinal="index"
          @remove="onRemoveEntry"
          @update="onUpdateAirEntry"
        />

        <li class="flex justify-center space-x-3">
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
        </li>
      </TransitionList>
    </FormField>
  </section>
</template>

<script lang="ts" setup>
import { PressureUnit, TankDTO } from '@bottomtime/api';

import { v7 as uuid } from 'uuid';
import { reactive } from 'vue';

import { useCurrentUser } from '../../../store';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import TextHeading from '../../common/text-heading.vue';
import TransitionList from '../../common/transition-list.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import EditEntryAir from './edit-entry-air.vue';
import { BlankAirEntry, LogEntryAir } from './types';

interface EditBreathingGasProps {
  tanks: TankDTO[];
}

interface EditBreathingGasState {
  showConfirmRemoveDialog: boolean;
  entryToRemove?: LogEntryAir;
}

const currentUser = useCurrentUser();

const formData = defineModel<LogEntryAir[]>({ required: true });
defineProps<EditBreathingGasProps>();
const state = reactive<EditBreathingGasState>({
  showConfirmRemoveDialog: false,
});

function onAddTank() {
  formData.value.push({
    ...BlankAirEntry,
    id: uuid(),
    pressureUnit: currentUser.user?.settings.pressureUnit ?? PressureUnit.Bar,
  });
}

function onRemoveEntry(id: string) {
  state.entryToRemove = formData.value.find((air) => air.id === id);
  if (state.entryToRemove) {
    state.showConfirmRemoveDialog = true;
  }
}

function onCancelRemoveEntry() {
  state.entryToRemove = undefined;
  state.showConfirmRemoveDialog = false;
}

function onConfirmRemoveEntry() {
  const index = formData.value.findIndex(
    (air) => air.id === state.entryToRemove?.id,
  );
  if (index > -1) formData.value.splice(index, 1);

  if (!formData.value.length) onAddTank();

  state.showConfirmRemoveDialog = false;
}

function onUpdateAirEntry(update: LogEntryAir) {
  const index = formData.value.findIndex((air) => air.id === update.id);
  if (index > -1) formData.value[index] = update;
}
</script>
