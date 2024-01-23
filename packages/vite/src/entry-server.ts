import { renderToString } from 'vue/server-renderer';
import { createApp } from './main';
import { ApiClient } from './client';
import { Config } from './config';

export async function render(
  url: string,
  ssrManifest: Record<string, unknown>, // TODO: Do I need this?
): Promise<{ html: string }> {
  const { app, router } = createApp();
  router.push(url);

  const client = new ApiClient(Config.apiUrl);
  const currentUser = await client.users.getCurrentUser();

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = { currentUser, test: true };
  const html = await renderToString(app, ctx);

  return { html };
}
