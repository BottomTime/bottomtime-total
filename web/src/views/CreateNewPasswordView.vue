<template>
  <PageTitle title="Create New Password" />
  <section class="section">
    <RequireAnonymous>
      <div id="create-new-password-page" class="container">
        <div class="columns">
          <div class="column is-half-tablet is-offset-one-quarter-tablet">
            <CreateNewPasswordForm
              :token="query.token"
              :username="query.username"
            />
          </div>
        </div>
      </div>
    </RequireAnonymous>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import CreateNewPasswordForm from '@/components/users/CreateNewPasswordForm.vue';
import PageTitle from '@/components/PageTitle.vue';
import RequireAnonymous from '@/components/RequireAnonymous.vue';

const route = useRoute();

interface QueryParamters {
  username: string;
  token: string;
}

const query = computed<QueryParamters>(() => {
  const { user, token } = route.query;
  return {
    username: typeof user === 'string' ? user.trim() : '',
    token: typeof token === 'string' ? token.trim() : '',
  };
});
</script>
