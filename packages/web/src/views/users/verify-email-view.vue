<template>
  <PageTitle title="Verify Email" />
  <div class="grid grid-cols-1 md:grid-cols-5">
    <div class="col-start-1 col-span-1 md:col-start-2 md:col-span-3 min-h-16">
      <TransitionGroup name="fade">
        <div
          v-if="state.succeeded === true"
          data-testid="msg-success"
          class="ml-2 px-4 py-2 border-l-4 border-blue-400 bg-blue-300 dark:bg-blue-800 rounded-r-lg w-full text-lg text-success flex items-center gap-3"
        >
          <div>
            <i class="fa-regular fa-circle-check fa-2x"></i>
          </div>

          <div class="space-y-3">
            <TextHeading>Success!</TextHeading>
            <p>Your email address has been successfully verified!</p>
            <p>
              You can click <NavLink to="/">here</NavLink> to return to the home
              page.
            </p>
          </div>
        </div>

        <div
          v-else-if="state.succeeded === false"
          class="ml-2 px-4 py-2 border-l-4 border-blue-400 bg-blue-300 dark:bg-blue-800 text-danger-dark rounded-r-lg text-lg w-full flex items-center gap-3"
          data-testid="msg-failed"
        >
          <div>
            <i class="fa-regular fa-circle-xmark fa-2x"></i>
          </div>

          <div class="space-y-3">
            <TextHeading>Failed!</TextHeading>
            <p>Your email address could not be verified. Reason given:</p>

            <p class="font-bold">{{ state.error }}</p>

            <p>
              You can try again later or you can request a new verification
              email from your
              <NavLink to="/account">account page</NavLink>. Alternatively, you
              can return to the <NavLink to="/">home page</NavLink>.
            </p>
          </div>
        </div>

        <div v-else class="text-center text-lg">
          <LoadingSpinner message="Verifying email address..." />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { z } from 'zod';

import { useClient } from '../../api-client';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NavLink from '../../components/common/nav-link.vue';
import PageTitle from '../../components/common/page-title.vue';
import TextHeading from '../../components/common/text-heading.vue';
import { useOops } from '../../oops';

interface VerifyEmailViewState {
  succeeded?: boolean;
  error?: string;
}

const client = useClient();
const oops = useOops();
const route = useRoute();

const state = reactive<VerifyEmailViewState>({});

async function verifyEmail(user: string, token: string): Promise<void> {
  await oops(
    async () => {
      const result = await client.userAccounts.verifyEmail(user, token);
      state.succeeded = result.succeeded;
      state.error = result.reason;
    },
    {
      default: () => {
        state.succeeded = false;
        state.error =
          'An unexpected server error occurred while verifying your email. This is a problem on our end and we are looking into it. Please try again later.';
      },
    },
  );
}

onMounted(async () => {
  const queryParamsSchema = z.object({
    user: z.string(),
    token: z.string(),
  });

  const params = queryParamsSchema.safeParse(route.query);

  if (params.success) {
    await verifyEmail(params.data.user, params.data.token);
  } else {
    state.succeeded = false;
    state.error =
      'A valid token was not provided. Please check your email and use the link provided.';
  }
});
</script>

<style scoped></style>
