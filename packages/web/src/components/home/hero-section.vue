<template>
  <section class="my-20 mx-4">
    <div class="flex space-x-4 place-items-baseline">
      <h1 class="grow font-bold text-6xl font-title">Title</h1>
      <div>
        <FormButton type="primary" size="lg">Sign Up Now!</FormButton>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import FormButton from '../common/form-button.vue';
</script>
