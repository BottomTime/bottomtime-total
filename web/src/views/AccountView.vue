<template>
  <PageTitle title="Manage Account" />
  <section class="section">
    <RequireAuth>
      <div id="account-page" class="container">
        <div class="columns">
          <div class="column is-3-tablet is-offset-1-tablet">
            <AccountMenu />
          </div>
          <div class="column is-7-tablet">
            <RouterView />
          </div>
        </div>
      </div>
    </RequireAuth>
  </section>
</template>

<script lang="ts" setup>
import AccountMenu from '@/components/account/AccountMenu.vue';
import PageTitle from '@/components/PageTitle.vue';
import RequireAuth from '@/components/RequireAuth.vue';
</script>
