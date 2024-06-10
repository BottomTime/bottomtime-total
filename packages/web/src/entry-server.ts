import { ApiClientOptions } from '@bottomtime/api';

import { StateTree } from 'pinia';
import { renderToString } from 'vue/server-renderer';

import { createApp } from './main';

export async function render(
  url: string,
  initialState: Record<string, StateTree>,
  clientOptions?: ApiClientOptions,
): Promise<{ html: string; initialState: string }> {
  const { app, router, store } = createApp(clientOptions, initialState);
  await router.push(url);

  const html = await renderToString(app);

  return { html, initialState: JSON.stringify(store.state.value) };
}
