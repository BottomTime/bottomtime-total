<template>
  <section
    class="shadow-md shadow-grey-400 bg-gradient-to-t from-blue-700/40 to-blue-500/40 p-2 rounded-md space-y-3 px-6"
  >
    <TextHeading class="-ml-3" level="h2">Basic Info</TextHeading>

    <FormField
      label="Log #"
      control-id="logNumber"
      :invalid="v$.logNumber.$error"
      :error="v$.logNumber.$errors[0]?.$message"
    >
      <div class="relative">
        <FormTextBox
          v-model.number="formData.logNumber"
          control-id="logNumber"
          test-id="log-number"
          autofocus
          :invalid="v$.logNumber.$error"
          :error="v$.logNumber.$errors[0]?.$message"
        />
        <button
          class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 flex justify-center items-center px-2 text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover text-sm"
          data-testid="get-next-log-number"
          @click="$emit('next-log-number')"
        >
          Next Available Number
        </button>
      </div>
    </FormField>

    <FormField
      label="Entry Time"
      control-id="dp-input-entryTime"
      required
      :invalid="v$.entryTime.$error"
      :error="v$.entryTime.$errors[0]?.$message"
    >
      <div class="flex flex-col gap-1.5 lg:flex-row items-baseline">
        <FormDatePicker
          v-model="formData.entryTime"
          control-id="entryTime"
          mode="datetime"
          placeholder="Select entry time"
          :invalid="v$.entryTime.$error"
          :max-date="dayjs().endOf('day').toDate()"
        />

        <FormSelect
          v-model="formData.entryTimezone"
          control-id="entryTimeTimezone"
          test-id="entry-time-timezone"
          mode="datetime"
          placeholder="Select timezone"
          :options="Timezones"
        />
      </div>
    </FormField>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
      <FormField
        class="grow"
        label="Duration"
        control-id="duration"
        :invalid="v$.duration.$error"
        :error="v$.duration.$errors[0]?.$message"
        required
      >
        <DurationInput
          v-model="formData.duration"
          control-id="duration"
          test-id="duration"
          :invalid="v$.duration.$error"
        />
      </FormField>

      <FormField
        class="grow"
        label="Bottom time"
        control-id="bottomTime"
        :invalid="v$.bottomTime.$error"
        :error="v$.bottomTime.$errors[0]?.$message"
      >
        <DurationInput
          v-model="formData.bottomTime"
          control-id="bottomTime"
          test-id="bottomTime"
          :invalid="v$.bottomTime.$error"
        />
      </FormField>

      <FormField
        class="grow"
        label="Surface Interval"
        control-id="surfaceInterval"
        :invalid="v$.surfaceInterval.$error"
        :error="v$.surfaceInterval.$errors[0]?.$message"
      >
        <DurationInput
          v-model="formData.surfaceInterval"
          control-id="surfaceInterval"
          test-id="surfaceInterval"
          :invalid="v$.surfaceInterval.$error"
        />
      </FormField>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <FormField
        class="grow"
        label="Max depth"
        control-id="maxDepth"
        :invalid="v$.maxDepth.$error"
        :error="v$.maxDepth.$errors[0]?.$message"
      >
        <DepthInput
          v-model="formData.maxDepth"
          control-id="maxDepth"
          test-id="max-depth"
          :unit="formData.depthUnit"
          :invalid="v$.maxDepth.$error"
          @toggle-unit="onToggleDepthUnit"
        />
      </FormField>

      <FormField
        class="grow"
        label="Average depth"
        control-id="avgDepth"
        :invalid="v$.avgDepth.$error"
        :error="v$.avgDepth.$errors[0]?.$message"
      >
        <DepthInput
          v-model="formData.avgDepth"
          control-id="avgDepth"
          test-id="avg-depth"
          :unit="formData.depthUnit"
          :invalid="v$.avgDepth.$error"
          @toggle-unit="onToggleDepthUnit"
        />
      </FormField>
    </div>

    <FormField label="Tags">
      <FormTags
        v-model="formData.tags"
        :autocomplete="getTagAutoCompleteOptions"
      />
    </FormField>
  </section>
</template>

<script lang="ts" setup>
import { DepthUnit } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, integer, minValue, required } from '@vuelidate/validators';

import dayjs from 'src/dayjs';

import { depth, greaterThan, lessThan } from '../../../validators';
import DepthInput from '../../common/depth-input.vue';
import DurationInput from '../../common/duration-input.vue';
import FormDatePicker from '../../common/form-date-picker.vue';
import FormField from '../../common/form-field.vue';
import FormSelect from '../../common/form-select.vue';
import FormTags from '../../common/form-tags.vue';
import FormTextBox from '../../common/form-text-box.vue';
import TextHeading from '../../common/text-heading.vue';
import { LogEntryBasicInfo, Timezones } from './types';

// TODO: This should come from the database...
const tags = {
  'night dive': 'Night dive',
  'reef dive': 'Reef dive',
  'wreck dive': 'Wreck dive',
  'drift dive': 'Drift dive',
  'deep dive': 'Deep dive',
  'ice dive': 'Ice dive',
};

defineEmits<{
  (e: 'next-log-number'): void;
}>();

const formData = defineModel<LogEntryBasicInfo>({ required: true });
const v$ = useVuelidate<LogEntryBasicInfo>(
  {
    bottomTime: {
      positive: helpers.withMessage(
        'Bottom time must be a positive number',
        greaterThan(0),
      ),
      lessThanDuration: helpers.withMessage(
        'Bottom time must be less than duration',
        (val, others) => lessThan(others.duration || Infinity)(val),
      ),
    },
    duration: {
      required: helpers.withMessage('Duration is required', required),
      positive: helpers.withMessage(
        'Duration must be a positive number',
        greaterThan(0),
      ),
    },
    surfaceInterval: {
      positive: helpers.withMessage(
        'Surface interval time must be a positive number',
        minValue(0),
      ),
    },
    entryTime: {
      required: helpers.withMessage('Entry time is required', required),
    },
    logNumber: {
      integer: helpers.withMessage(
        'Log number must be a positive integer',
        integer,
      ),
      positive: helpers.withMessage(
        'Log number must be a positive number',
        greaterThan(0),
      ),
    },
    maxDepth: {
      positive: helpers.withMessage(
        'Depth must be numeric and greater than zero',
        (val, { depthUnit }) =>
          !helpers.req(val) || depth({ depth: val, unit: depthUnit }),
      ),
    },
    avgDepth: {
      positive: helpers.withMessage(
        'Depth must be numeric and greater than zero',
        (val, { depthUnit }) =>
          !helpers.req(val) || depth({ depth: val, unit: depthUnit }),
      ),
      lessThanMaxDepth: helpers.withMessage(
        'Average depth must be less than max depth',
        (val, others) => lessThan(others.maxDepth || Infinity)(val),
      ),
    },
  },
  formData,
);

function onToggleDepthUnit(newUnit: DepthUnit) {
  formData.value.depthUnit = newUnit;
}

function getTagAutoCompleteOptions(prefix: string): string[] {
  return Object.entries(tags)
    .filter(([key]) => key.startsWith(prefix.toLowerCase()))
    .map(([, value]) => value);
}
</script>
