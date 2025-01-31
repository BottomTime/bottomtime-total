<template>
  <TransitionGroup
    name="list-fade"
    tag="ul"
    class="*:border-b-2 last:*:border-0 *:border-secondary *:bg-gradient-to-b *:from-blue-400/25 *:to-blue-700/25 *:my-2 *:p-2 *:rounded-md *:shadow-sm *:shadow-grey-700 dark:*:shadow-grey-500"
  >
    <slot></slot>
  </TransitionGroup>
</template>

<script lang="ts" setup></script>
