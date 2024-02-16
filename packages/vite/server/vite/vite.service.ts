import { ApiClientOptions } from '@/client';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ViteDevServer, createServer } from 'vite';
import { SSRContext } from 'vue/server-renderer';

import { Config } from '../config';
import { ViteServer } from './constants';

export type RenderResult = {
  head?: string;
  html: string;
  ctx: SSRContext;
};

@Injectable()
export class ViteService implements OnModuleInit {
  private readonly log = new Logger(ViteService.name);

  constructor(@Inject(ViteServer) private vite: ViteDevServer) {}

  async onModuleInit(): Promise<void> {
    if (Config.isProduction) {
      this.log.debug(
        'Running in production mode; Skipping Vite dev server initialization.',
      );
      return;
    }

    this.log.debug('Initializing Vite dev server...');
    this.vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'custom',
      base: '/',
    });
  }

  async render(
    url: string,
    initialState: SSRContext,
    clientOptions: ApiClientOptions,
  ): Promise<RenderResult> {
    const path = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../src/entry-server.ts',
    );
    this.log.debug(`SSR Load Module: ${path}`);
    const { render } = await this.vite.ssrLoadModule('/src/entry-server.ts');
    const result = await render(url, initialState, clientOptions);
    return result;
  }

  async transformHtml(url: string, html: string): Promise<string> {
    const transformed = await this.vite.transformIndexHtml(url, html);
    return transformed ?? html;
  }
}
