<template>
  <div class="field has-addons">
    <div class="control">
      <div class="select is-rounded is-small">
        <select
          :id="`${id}-year`"
          v-model.number="data.year"
          @change="onChange"
        >
          <option value="">(year)</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="data.year" class="control">
      <div class="select is-rounded is-small">
        <select
          :id="`${id}-month`"
          v-model.number="data.month"
          @change="onChange"
        >
          <option
            v-for="month in months"
            :key="month.value"
            :value="month.value"
          >
            {{ month.name }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="data.year && data.month" class="control">
      <div class="select is-rounded is-small">
        <select :id="`${id}-day`" v-model.number="data.day" @change="onChange">
          <option value="">(day)</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';

interface FuzzyDatePickerProps {
  id: string;
  maxYear?: number;
  minYear?: number;
  modelValue: string;
}

interface FuzzyDatePickerData {
  year?: number;
  month?: number;
  day?: number;
}

const props = withDefaults(defineProps<FuzzyDatePickerProps>(), {
  minYear: new Date().getFullYear() - 100,
  maxYear: new Date().getFullYear(),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const data = reactive<FuzzyDatePickerData>(parseValue(props.modelValue));

const years = computed(() => {
  const yearValues = new Array<number>(props.maxYear - props.minYear + 1);
  for (let i = 0; i < yearValues.length; i++) {
    yearValues[i] = props.maxYear - i;
  }
  return yearValues;
});

const months = [
  { value: '', name: '(month)' },
  { value: '1', name: 'Jan' },
  { value: '2', name: 'Feb' },
  { value: '3', name: 'Mar' },
  { value: '4', name: 'Apr' },
  { value: '5', name: 'May' },
  { value: '6', name: 'Jun' },
  { value: '7', name: 'Jul' },
  { value: '8', name: 'Aug' },
  { value: '9', name: 'Sep' },
  { value: '10', name: 'Oct' },
  { value: '11', name: 'Nov' },
  { value: '12', name: 'Dec' },
];
const DaysInMonth: Record<number, number> = {
  [1]: 31,
  [2]: 28,
  [3]: 31,
  [4]: 30,
  [5]: 31,
  [6]: 30,
  [7]: 31,
  [8]: 31,
  [9]: 30,
  [10]: 31,
  [11]: 30,
  [12]: 31,
};

const days = computed(() => {
  if (!data.month || !data.year) return [];
  let daysInMonth = DaysInMonth[data.month];
  if (data.month === 2 && data.year % 4 === 0) daysInMonth++;

  const dayValues = new Array<number>(daysInMonth);
  for (let i = 0; i < dayValues.length; i++) {
    dayValues[i] = i + 1;
  }
  return dayValues;
});

function parseValue(modelValue: string): FuzzyDatePickerData {
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(modelValue)) return {};

  const parts = modelValue.split('-');
  return {
    year: parts[0] ? parseInt(parts[0]) : undefined,
    month: parts[1] ? parseInt(parts[1]) : undefined,
    day: parts[2] ? parseInt(parts[2]) : undefined,
  };
}

function onChange() {
  let dateString: string;

  if (!data.year) dateString = '';
  else if (!data.month) dateString = `${data.year}`;
  else if (!data.day)
    dateString = `${data.year}-${data.month.toString().padStart(2, '0')}`;
  else
    dateString = `${data.year}-${data.month
      .toString()
      .padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;

  emit('update:modelValue', dateString);
}

watch(props, (newProps) => {
  const { year, month, day } = parseValue(newProps.modelValue);
  data.year = year;
  data.month = month;
  data.day = day;
});
</script>
