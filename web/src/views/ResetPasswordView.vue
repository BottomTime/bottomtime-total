<template>
  <PageTitle title="Reset Password" />
  <section class="section">
    <RequireAnonymous>
      <div id="reset-password-page" class="container">
        <div class="columns">
          <div class="column is-half-tablet is-offset-one-quarter-tablet">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </RequireAnonymous>
  </section>
</template>

<script lang="ts" setup>
import PageTitle from '@/components/PageTitle.vue';
import RequireAnonymous from '@/components/RequireAnonymous.vue';
import ResetPasswordForm from '@/components/users/ResetPasswordForm.vue';
</script>
