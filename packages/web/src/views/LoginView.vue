<template>
  <PageTitle title="Login" />
  <section class="section">
    <RequireAnonymous>
      <div id="login-page" class="container">
        <LoginForm />
      </div>
    </RequireAnonymous>
  </section>
</template>

<script lang="ts" setup>
import LoginForm from '@/components/users/LoginForm.vue';
import PageTitle from '@/components/PageTitle.vue';
import RequireAnonymous from '@/components/RequireAnonymous.vue';
</script>
