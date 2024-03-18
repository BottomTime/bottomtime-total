import { ApiClientOptions } from '@/client';
import { AppInitialState } from '@/initial-state';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { ViteDevServer, createServer } from 'vite';
import { SSRContext } from 'vue/server-renderer';

export type RenderResult = {
  head?: string;
  html: string;
  ctx: SSRContext;
};

type RenderFunc = (
  url: string,
  initialState: AppInitialState,
  clientOptions: ApiClientOptions,
) => Promise<RenderResult>;

const NotInitializedError = new Error('Vite dev server not initialized');

@Injectable()
export class DevService implements OnModuleInit {
  private readonly log = new Logger(DevService.name);
  private devServer: ViteDevServer | undefined;
  private renderFunc: RenderFunc | undefined;

  async onModuleInit(): Promise<void> {
    this.log.debug('Initializing Vite dev server...');
    this.devServer = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'custom',
      base: '/',
    });

    const module = await this.devServer.ssrLoadModule('/src/entry-server.ts');
    this.renderFunc = module.render;
  }

  async render(
    url: string,
    initialState: AppInitialState,
    clientOptions: ApiClientOptions,
  ): Promise<RenderResult> {
    if (!this.renderFunc) {
      throw NotInitializedError;
    }

    return await this.renderFunc(url, initialState, clientOptions);
  }

  async transformHtml(url: string, html: string): Promise<string> {
    if (!this.devServer) {
      throw NotInitializedError;
    }

    return await this.devServer.transformIndexHtml(url, html);
  }
}
