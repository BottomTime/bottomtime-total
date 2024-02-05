<template>
  <div>Yo</div>
</template>

<script setup lang="ts">
import { User } from '../../client';

type ManageUserProps = {
  user: User;
};

defineProps<ManageUserProps>();
</script>
