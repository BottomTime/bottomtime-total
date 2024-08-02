import { ApiClientOptions } from '@bottomtime/api';

import { PollingMode, getClient } from 'configcat-node';
import { StateTree } from 'pinia';
import { renderToString } from 'vue/server-renderer';

import { Config } from './config';
import { createApp } from './main';

export async function render(
  url: string,
  initialState: Record<string, StateTree>,
  clientOptions?: ApiClientOptions,
): Promise<{ html: string; initialState: string }> {
  const configCat = getClient(Config.configCatSdkKey, PollingMode.AutoPoll);
  const { app, router, store } = createApp(
    configCat,
    clientOptions,
    initialState,
  );
  await router.push(url);

  const html = await renderToString(app);

  return { html, initialState: JSON.stringify(store.state.value) };
}
