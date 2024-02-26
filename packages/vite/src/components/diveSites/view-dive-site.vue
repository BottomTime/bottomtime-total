<template>
  <div>View Dive Site</div>
  <p>
    {{ JSON.stringify(site) }}
  </p>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

type ViewDiveSiteProps = {
  site: DiveSiteDTO;
};

defineProps<ViewDiveSiteProps>();
</script>
