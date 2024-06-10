import { ApiClientOptions } from '@bottomtime/api';

import { StateTree } from 'pinia';
import { SSRContext, renderToString } from 'vue/server-renderer';

import { createApp } from './main';

export async function render(
  url: string,
  initialState: Record<string, StateTree>,
  clientOptions?: ApiClientOptions,
): Promise<{ html: string; ctx: SSRContext }> {
  const { app, router } = createApp(clientOptions, initialState);
  await router.push(url);

  const ctx = initialState;
  const html = await renderToString(app, ctx);

  return { html, ctx };
}
