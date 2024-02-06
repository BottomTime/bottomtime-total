<template>
  <div class="flex flex-row gap-2">
    <FormSelect
      v-model="data.year"
      :control-id="`${controlId}-year`"
      :options="yearOptions"
    />
    <FormSelect
      v-if="data.year"
      v-model="data.month"
      :control-id="`${controlId}-month`"
      :options="monthOptions"
    />
    <FormSelect
      v-if="data.year && data.month"
      v-model="data.day"
      :control-id="`${controlId}-day`"
      :options="dayOptions"
    />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, reactive, watch } from 'vue';

import { SelectOption } from '../../common';
import FormSelect from './form-select.vue';

type FuzzyDate = {
  year: string;
  month: string;
  day: string;
};
type FormFuzzyDateProps = {
  controlId: string;
  maxYear?: number;
  minYear?: number;
};

const FuzzyDateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const EmptyValue: FuzzyDate = {
  year: '',
  month: '',
  day: '',
};

const props = withDefaults(defineProps<FormFuzzyDateProps>(), {
  maxYear: dayjs().year(),
  minYear: dayjs().year() - 100,
});
const value = defineModel<string>();
const data = reactive<FuzzyDate>(EmptyValue);

const yearOptions = computed<SelectOption[]>(() => {
  return [
    { label: '(Year)', value: '' },
    ...Array.from({ length: props.maxYear - props.minYear }, (_, i) => {
      const year = props.maxYear - i;
      return { value: year.toString() };
    }),
  ];
});

const monthOptions = computed<SelectOption[]>(() => {
  return [
    { label: '(Month)', value: '' },
    ...Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      return { value: month };
    }),
  ];
});

const dayOptions = computed<SelectOption[]>(() => {
  const daysInMonth = dayjs(
    `${data.year}-${data.month}`,
    'YYYY-MM',
  ).daysInMonth();
  return [
    { label: '(Day)', value: '' },
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      return { value: day };
    }),
  ];
});

watch(value, (newValue) => {
  if (!newValue || !FuzzyDateRegex.test(newValue)) {
    Object.assign(data, EmptyValue);
    return;
  }

  const [year, month, day] = newValue.split('-');
  data.year = year;
  data.month = month || '';
  data.day = day || '';
});

watch(
  data,
  () => {
    let newValue: string;

    // Reset month and day if year is cleared.
    if (!data.year) {
      data.month = '';
      data.day = '';
    }

    // Reset day if month is cleared.
    if (!data.month) data.day = '';

    // If year or month is changed make sure that the day is still valid.
    if (data.year && data.month && data.day) {
      const daysInMonth = dayjs(
        `${data.year}-${data.month}`,
        'YYYY-MM',
      ).daysInMonth();

      if (parseInt(data.day, 10) > daysInMonth) data.day = '';
    }

    if (data.year && data.month && data.day)
      newValue = `${data.year}-${data.month}-${data.day}`;
    else if (data.year && data.month) newValue = `${data.year}-${data.month}`;
    else if (data.year) newValue = data.year;
    else newValue = '';

    value.value = newValue;
  },
  { deep: true },
);
</script>
