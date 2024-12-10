<template>
  <PageTitle :title="Title" />
  <BreadCrumbs :items="Breadcrumbs" />
  <div class="grid grid-cols-1 md:grid-cols-5">
    <div class="col-start-1 col-span-1 md:col-start-2 md:col-span-3">
      <div class="space-y-3">
        <TextHeading>We appreciate your patronage!</TextHeading>

        <p class="italic">
          Thanks for trying out our membership program! Your request to cancel
          your membership has been processed and you have been returned to a
          free account.
        </p>

        <p class="italic">
          As a reminder, any data you have provided or uploaded using the
          features of your previous membership will be retained and you will
          still have access to it. However, you may not be able to edit, delete,
          or modify that data without the features of your previous membership.
          You will also keep all of the XP and badges you have earned while on
          your previous membership.
        </p>

        <p class="italic">
          We hope you continue to enjoy using our platform and that you will
          consider re-instating your membership at a later time. ❤️
        </p>

        <p class="flex flex-col gap-0.5 italic">
          <span>Cheers,</span>
          <span>The Bottom Time Team</span>
        </p>

        <p class="flex justify-evenly">
          <RouterLink to="/">Return to home page</RouterLink>
          <RouterLink to="/account">Return to your account page</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router';

import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import PageTitle from '../../components/common/page-title.vue';
import TextHeading from '../../components/common/text-heading.vue';

const Title = 'Membership Canceled';

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Account',
    to: '/account',
  },
  {
    label: Title,
    active: true,
  },
] as const;
</script>
