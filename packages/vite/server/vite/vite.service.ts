import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RequestHandler } from 'express';
import { dirname, resolve } from 'path';
import { ViteDevServer, createServer } from 'vite';
import { fileURLToPath } from 'url';
import { Config } from '../config';

export type RenderResult = {
  head?: string;
  html: string;
};

@Injectable()
export class ViteService implements OnModuleInit {
  private readonly log = new Logger(ViteService.name);
  private vite: ViteDevServer | undefined;
  // private renderFunction: () => Promise<string> | undefined;

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

  async render(): Promise<RenderResult> {
    if (!this.vite) {
      return {
        head: '',
        html: '<p>Vite server is not initialized</p>',
      };
    }

    const path = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../src/entry-server.ts',
    );
    this.log.debug(`SSR Load Module: ${path}`);
    const module = await this.vite.ssrLoadModule('/src/entry-server.ts');

    const result = await module.render();
    return result;
  }

  async transformHtml(html: string): Promise<string> {
    // TODO: Figure out what the trasformation

    const transformed = await this.vite?.transformIndexHtml('/', html);
    return transformed ?? 'lol';
  }

  get middlewares(): RequestHandler | undefined {
    return this.vite?.middlewares;
  }
}
