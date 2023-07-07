<template>
  <PageTitle title="User Profile" />
  <section class="section">
    <RequireAuth>
      <div id="profile-page" class="container">
        <div class="columns">
          <div
            class="column is-offset-one-fifth-desktop is-three-fifths-desktop"
          >
            <ProfileForm :profile="user!.profile" />
          </div>
        </div>
      </div>
    </RequireAuth>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import PageTitle from '@/components/PageTitle.vue';
import ProfileForm from '@/components/users/ProfileForm.vue';
import RequireAuth from '@/components/RequireAuth.vue';
import { useStore } from '@/store';

const store = useStore();
const user = computed(() => store.state.currentUser);
</script>
