<template>
  <DatePicker
    v-model="value"
    :uid="id"
    :input-class-name="inputClasses"
    menu-class-name="rounded-lg bg-secondary text-sm text-grey-950 shadow-lg"
    time-picker-inline
    :enable-time-picker="mode === 'datetime'"
    auto-apply
    :placeholder="placeholder"
    :disabled="disabled"
    position="left"
  />
</template>

<script lang="ts" setup>
import DatePicker from '@vuepic/vue-datepicker';

import { computed } from 'vue';

interface FormDatePickerProps {
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  mode?: 'date' | 'datetime';
  placeholder?: string;
}

const value = defineModel<string | Date>();
const props = withDefaults(defineProps<FormDatePickerProps>(), {
  disabled: false,
  invalid: false,
  mode: 'date',
});

const inputClasses = computed(() => {
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
  return `px-1 py-0 border border-${highlightColour} focus:ring-${highlightColour} focus:border-${highlightColour} dark:focus:ring-${highlightColour} dark:focus:border-${highlightColour} bg-grey-200 dark:bg-grey-300 rounded-lg text-grey-950 placeholder-grey-700 disabled:text-grey-700 disabled:bg-grey-400 disabled:dark:bg-grey-500 disabled:ring-0`;
});
</script>

<style lang="css">
@import url('https://unpkg.com/@vuepic/vue-datepicker@latest/dist/main.css');

.dp__theme_light {
  --dp-background-color: #bae6fd;
  --dp-text-color: #0c0a09;
  --dp-hover-color: #e0f2fe;
  --dp-hover-text-color: var(--dp-text-color);
  --dp-hover-icon-color: #959595;
  --dp-primary-color: #1976d2;
  --dp-primary-disabled-color: #6bacea;
  --dp-primary-text-color: #0ea5e9;
  --dp-secondary-color: #c0c4cc;
  --dp-border-color: #0c0a09;
  --dp-menu-border-color: #0c0a09;
  --dp-border-color-hover: var(--dp-border-color);
  --dp-disabled-color: #f6f6f6;
  --dp-scroll-bar-background: #f3f3f3;
  --dp-scroll-bar-color: #959595;
  --dp-success-color: #10b981;
  --dp-success-color-disabled: #a3d9b1;
  --dp-icon-color: #959595;
  --dp-danger-color: #ff6f60;
  --dp-marker-color: #ff6f60;
  --dp-tooltip-color: #fafafa;
  --dp-disabled-color-text: #8e8e8e;
  --dp-highlight-color: rgb(25 118 210 / 10%);
  --dp-range-between-dates-background-color: var(--dp-hover-color, #f3f3f3);
  --dp-range-between-dates-text-color: var(--dp-hover-text-color, #212121);
  --dp-range-between-border-color: var(--dp-hover-color, #f3f3f3);
}

:root {
  /*General*/
  --dp-font-family: 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif';

  --dp-border-radius: 4px; /*Configurable border-radius*/
  --dp-cell-border-radius: 4px; /*Specific border radius for the calendar cell*/
  --dp-common-transition: all 0.1s ease-in; /*Generic transition applied on buttons and calendar cells*/

  /*Sizing*/
  --dp-button-height: 35px; /*Size for buttons in overlays*/
  --dp-month-year-row-height: 35px; /*Height of the month-year select row*/
  --dp-month-year-row-button-size: 35px; /*Specific height for the next/previous buttons*/
  --dp-button-icon-height: 20px; /*Icon sizing in buttons*/
  --dp-cell-size: 35px; /*Width and height of calendar cell*/
  --dp-cell-padding: 5px; /*Padding in the cell*/
  --dp-common-padding: 10px; /*Common padding used*/
  --dp-input-icon-padding: 35px; /*Padding on the left side of the input if icon is present*/
  --dp-input-padding: 6px 30px 6px 12px; /*Padding in the input*/
  --dp-menu-min-width: 260px; /*Adjust the min width of the menu*/
  --dp-action-buttons-padding: 2px 5px; /*Adjust padding for the action buttons in action row*/
  --dp-row-margin: 5px 0; /*Adjust the spacing between rows in the calendar*/
  --dp-calendar-header-cell-padding: 0.5rem; /*Adjust padding in calendar header cells*/
  --dp-two-calendars-spacing: 10px; /*Space between multiple calendars*/
  --dp-overlay-col-padding: 3px; /*Padding in the overlay column*/
  --dp-time-inc-dec-button-size: 32px; /*Sizing for arrow buttons in the time picker*/
  --dp-menu-padding: 6px 8px; /*Menu padding*/

  /*Font sizes*/
  --dp-font-size: 0.8rem; /*Default font-size*/
  --dp-preview-font-size: 0.8rem; /*Font size of the date preview in the action row*/
  --dp-time-font-size: 0.8rem; /*Font size in the time picker*/

  /*Transitions*/
  --dp-animation-duration: 0.1s; /*Transition duration*/
  --dp-menu-appear-transition-timing: cubic-bezier(
    0.4,
    0,
    1,
    1
  ); /*Timing on menu appear animation*/
  --dp-transition-timing: ease-out; /*Timing on slide animations*/
}
</style>
