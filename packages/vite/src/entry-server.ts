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

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = initialState ?? {};
  const html = await renderToString(app, ctx);

  return { html, ctx };
}
