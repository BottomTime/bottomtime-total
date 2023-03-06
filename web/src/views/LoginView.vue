<template>
  <PageTitle title="Login" />
  <section class="section">
    <div id="login-page" class="container">
      <LoginForm />
    </div>
  </section>
</template>

<script lang="ts" setup>
import LoginForm from '@/components/users/LoginForm.vue';
import PageTitle from '@/components/PageTitle.vue';
</script>
