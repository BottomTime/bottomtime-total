import { ApiClientOptions } from '@bottomtime/api';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { StateTree } from 'pinia';
import { fileURLToPath } from 'url';

import { RenderFunc } from '../constants';

@Injectable()
export class ProductionService implements OnModuleInit {
  private readonly log = new Logger(ProductionService.name);
  private htmlTemplate: string | undefined;
  private ssrManifest: Record<string, unknown> | undefined;
  private readonly serverEntryPath: string;
  private ssrRender: RenderFunc | undefined;

  constructor() {
    this.serverEntryPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../dist/server/entry-server.js',
    );
  }

  async onModuleInit(): Promise<void> {
    // Load the template for the index.html and the SSR manifest JSON file from disk and cache them.
    const htmlTemplatePath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../dist/client/index.html',
    );
    const ssrManifestPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../dist/client/.vite/ssr-manifest.json',
    );

    this.log.debug(`Reading HTML template from ${htmlTemplatePath}...`);
    this.htmlTemplate = await readFile(htmlTemplatePath, 'utf-8');
    this.log.verbose('Raw HTML template loaded:', this.htmlTemplate);

    this.log.debug(`Reading SSR manifest from ${ssrManifestPath}...`);
    this.ssrManifest = await import(ssrManifestPath);
    this.log.verbose('Raw SSR manifest loaded:', this.ssrManifest);

    const { render } = await import(this.serverEntryPath);
    this.ssrRender = render;
  }

  async renderPage(
    url: string,
    initialState: Record<string, StateTree>,
    clientOptions: ApiClientOptions,
  ): Promise<string> {
    if (!this.ssrRender) {
      throw new Error(
        'SSR render function not loaded. Module did not initialize correctly.',
      );
    }

    this.log.verbose('Rendering Vue content', {
      url,
      initialState,
      clientOptions,
    });
    const {
      head,
      html: content,
      initialState: ctx,
    } = await this.ssrRender(url, initialState, clientOptions);

    if (!this.htmlTemplate) {
      throw new Error(
        'HTML template not loaded. Module did not initialize correctly.',
      );
    }

    return Mustache.render(this.htmlTemplate, {
      head,
      content,
      initialState: ctx,
    });
  }

  getSsrManifest(): Record<string, unknown> {
    if (!this.ssrManifest) {
      throw new Error(
        'SSR manifest not loaded. Module did not initialize correctly.',
      );
    }

    return this.ssrManifest;
  }
}
