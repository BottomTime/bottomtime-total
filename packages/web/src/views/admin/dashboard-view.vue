<template>
  <PageTitle title="Admin Dashboard" />
  <RequireAuth :role="RequiredRole">
    <BreadCrumbs :items="breadcrumbs" />

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 place-items-stretch"
    >
      <RouterLink
        to="/admin/users"
        class="text-grey-800 dark:text-grey-50 no-underline"
      >
        <FormBox class="space-y-3">
          <TextHeading class="space-x-3">
            <span>
              <i class="fas fa-users fa-lg"></i>
            </span>
            <span>Manage Users</span>
          </TextHeading>
          <p class="text-sm italic">
            Manage user accounts including changing roles, resetting passwords,
            suspending/re-activating accounts, updating profiles and so on.
          </p>
        </FormBox>
      </RouterLink>

      <RouterLink
        to="/admin/alerts"
        class="text-grey-800 dark:text-grey-50 no-underline"
      >
        <FormBox class="space-y-3">
          <TextHeading class="space-x-3">
            <span>
              <i class="fas fa-bell fa-lg"></i>
            </span>
            <span>Manage Alerts</span>
          </TextHeading>
          <p class="text-sm italic">
            Manage alerts that appear on the home page. Add, edit or delete
            alerts as well as update the date and times at which they become
            visible or expire.
          </p>
        </FormBox>
      </RouterLink>

      <RouterLink
        to="/admin/tanks"
        class="text-grey-800 dark:text-grey-50 no-underline"
      >
        <FormBox class="space-y-3">
          <TextHeading class="space-x-3">
            <span>
              <i class="fas fa-fish fa-lg"></i>
            </span>
            <span>Manage Tank Profiles</span>
          </TextHeading>
          <p class="text-sm italic">
            Add, edit, or delete default tank profiles for users to use in their
            log entries.
          </p>
        </FormBox>
      </RouterLink>

      <RouterLink
        to="/admin/shops"
        class="text-grey-800 dark:text-grey-50 no-underline"
      >
        <FormBox class="space-y-3">
          <TextHeading class="space-x-3">
            <span>
              <i class="fa-solid fa-shop"></i>
            </span>
            <span>Manage Dive Shops</span>
          </TextHeading>
          <p class="text-sm italic">
            Manage dive shops. Espeicially, for the purposes of fulfilling
            verification requests.
          </p>
        </FormBox>
      </RouterLink>

      <RouterLink
        to="/admin/agencies"
        class="text-grey-800 dark:text-grey-50 no-underline"
      >
        <FormBox class="space-y-3">
          <TextHeading class="space-x-3">
            <span></span>
            <span>Manage Agencies</span>
          </TextHeading>
          <p class="text-sm italic">
            Manage dive agencies that provide certifications and courses.
          </p>
        </FormBox>
      </RouterLink>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserRole } from '@bottomtime/api';

import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import FormBox from '../../components/common/form-box.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import TextHeading from '../../components/common/text-heading.vue';

const breadcrumbs: Breadcrumb[] = [{ label: 'Admin', active: true }];
const RequiredRole = computed(() => UserRole.Admin);
</script>
