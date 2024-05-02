<template>
  <div>Oh hai!</div>
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

interface ViewLogbookEntryProps {
  entry: LogEntryDTO;
}

defineProps<ViewLogbookEntryProps>();
</script>
