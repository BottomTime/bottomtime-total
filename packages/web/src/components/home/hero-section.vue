<template>
  <section class="my-20 mx-4">
    <div class="flex space-x-4 justify-between items-center">
      <h1 class="font-bold text-6xl font-title">Bottom Time</h1>
      <div v-if="currentUser.anonymous">
        <FormButton type="primary" size="lg">Sign Up Now!</FormButton>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';

const currentUser = useCurrentUser();
</script>
