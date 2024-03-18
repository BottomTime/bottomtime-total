import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { PageOptions } from '../constants';

@Injectable()
export class ProductionService implements OnModuleInit {
  private readonly log = new Logger(ProductionService.name);
  private htmlTemplate: string | undefined;
  private ssrManifest: Record<string, unknown> | undefined;

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
  }

  async renderHtml(opts: PageOptions): Promise<string> {
    if (!this.htmlTemplate) {
      throw new Error(
        'HTML template not loaded. Module did not initialize correctly.',
      );
    }

    return Mustache.render(this.htmlTemplate, opts);
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
