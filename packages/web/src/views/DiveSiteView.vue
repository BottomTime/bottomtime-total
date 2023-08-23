<template>
  <PageTitle v-if="!state.notFound && !state.isLoading" :title="pageTitle">
    <nav class="breadcrumb">
      <ul>
        <li>
          <RouterLink to="/diveSites">Dive Sites</RouterLink>
        </li>
        <li class="is-active is-capitalized">
          <a href="#">{{ pageTitle }}</a>
        </li>
      </ul>
    </nav>
  </PageTitle>
  <section class="section">
    <div id="dive-site-page" class="container">
      <ViewDiveSite v-if="state.site" :site="state.site" />
      <NotFound v-else />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue';
import PageTitle from '@/components/PageTitle.vue';
import ViewDiveSite from '@/components/diveSites/ViewDiveSite.vue';
import { inject } from '@/helpers';
import { ApiClientKey, WithErrorHandlingKey } from '@/injection-keys';
import { DiveSite } from '@/client/diveSites';
import { useRoute } from 'vue-router';
import NotFound from '@/components/errors/NotFound.vue';

interface DiveSiteViewState {
  site?: DiveSite;
  isLoading: boolean;
  notFound: boolean;
}

const client = inject(ApiClientKey);
const route = useRoute();
const withErrorHandling = inject(WithErrorHandlingKey);

const state = reactive<DiveSiteViewState>({
  isLoading: true,
  notFound: false,
});
const pageTitle = computed(() => state.site?.name ?? 'View Dive Site');
const editMode = computed(() => false);

onMounted(async () => {
  state.isLoading = true;
  await withErrorHandling(
    async () => {
      const siteId = route.params.siteId as string;
      state.site = await client.diveSites.getDiveSite(siteId);
    },
    {
      [404]: async () => {
        state.notFound = true;
      },
    },
  );
  state.isLoading = false;
});
</script>
