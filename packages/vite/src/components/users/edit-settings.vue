<template>
  <form @submit.prevent="">
    <TextHeading>Preferred Units</TextHeading>
    <div class="flex flex-row gap-6 mb-4">
      <FormLabel class="w-40 text-right" label="Depth" />
      <FormRadio
        v-for="option in DepthOptions"
        :key="option.id"
        v-model="data.depthUnit"
        :control-id="option.id"
        :group="option.group"
        :value="option.value"
      >
        {{ option.label }}
      </FormRadio>
    </div>

    <TextHeading>Privacy</TextHeading>
  </form>
</template>

<script setup lang="ts">
import { DepthUnit, UserDTO, UserSettingsDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import FormLabel from '../common/form-label.vue';
import FormRadio from '../common/form-radio.vue';
import TextHeading from '../common/text-heading.vue';

type EditSettingsProps = {
  user: UserDTO;
};
type RadioOption = {
  id: string;
  group: string;
  value: string;
  label: string;
};

const DepthOptions: RadioOption[] = [
  {
    id: 'depth-meters',
    group: 'depth',
    value: DepthUnit.Meters,
    label: 'Meters (m)',
  },
  {
    id: 'depth-feet',
    group: 'depth',
    value: DepthUnit.Feet,
    label: 'Feet (ft)',
  },
];

const props = defineProps<EditSettingsProps>();
const data = reactive<UserSettingsDTO>({
  depthUnit: props.user.settings.depthUnit,
  pressureUnit: props.user.settings.pressureUnit,
  temperatureUnit: props.user.settings.temperatureUnit,
  weightUnit: props.user.settings.weightUnit,
  profileVisibility: props.user.settings.profileVisibility,
});
</script>
