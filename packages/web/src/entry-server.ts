import { SSRContext, renderToString } from 'vue/server-renderer';

import { ApiClientOptions } from './client';
import { createApp } from './main';

export async function render(
  url: string,
  initialState: SSRContext,
  clientOptions?: ApiClientOptions,
): Promise<{ html: string; ctx: SSRContext }> {
  const { app, router } = createApp(clientOptions);
  await router.push(url);

  const ctx = initialState;
  const html = await renderToString(app, ctx);

  return { html, ctx };
}
