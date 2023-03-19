<template>
  <PageTitle title="User Profile" />
  <section class="section">
    <div id="profile-page" class="container">
      <ProfileForm />
    </div>
  </section>
</template>

<script lang="ts" setup>
import PageTitle from '@/components/PageTitle.vue';
import ProfileForm from '@/components/profile/ProfileForm.vue';
</script>
