<template>
  <li class="capitalize">{{ operator.name }}</li>
</template>

<script lang="ts" setup>
import { DiveOperatorDTO } from '@bottomtime/api';

interface DiveOperatorsListItemProps {
  operator: DiveOperatorDTO;
}

defineProps<DiveOperatorsListItemProps>();
</script>
