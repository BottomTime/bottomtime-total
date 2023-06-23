<template>
  <PageTitle title="Sign Up" />
  <section class="section">
    <RequireAnonymous>
      <div id="signup-page" class="container">
        <div class="columns">
          <div class="column is-offset-one-quarter-tablet is-half-tablet">
            <SignupForm />
          </div>
        </div>
      </div>
    </RequireAnonymous>
  </section>
</template>

<script lang="ts" setup>
import PageTitle from '@/components/PageTitle.vue';
import SignupForm from '@/components/users/SignUpForm.vue';
import RequireAnonymous from '@/components/RequireAnonymous.vue';
</script>
