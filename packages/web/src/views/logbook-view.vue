<template>
  <PageTitle title="Logbook" />
  <div>But how??</div>
</template>

<script lang="ts" setup>
import { onServerPrefetch, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

onServerPrefetch(async () => {});
</script>
