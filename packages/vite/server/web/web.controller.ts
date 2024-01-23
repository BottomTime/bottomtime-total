import { Controller, Get, Inject, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { OriginalUrl } from '../original-url.decorator';
import { PageOptions } from '../constants';
import { WebService } from './web.service';

@Controller()
export class WebController {
  private readonly log = new Logger(WebController.name);
  private readonly serverEntryPath: string;

  constructor(@Inject(WebService) private readonly service: WebService) {
    this.serverEntryPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../dist/server/entry-server.js',
    );
  }

  @Get('*')
  async index(@OriginalUrl() url: string, @Res() res: Response): Promise<void> {
    this.log.debug(`Handling render request for: ${url}`);

    const { render: ssrRender } = await import(this.serverEntryPath);
    const { head, html: content } = await ssrRender(
      url,
      this.service.getSsrManifest(),
    );
    this.log.verbose('Raw server-rendered Vue content:', content);

    const opts: PageOptions = {
      appTitle: 'Bottom Time',
      pageTitle: 'Home',
      head,
      content,
    };
    const html = await this.service.renderHtml(opts);
    this.log.verbose('Rendered HTML:', html);

    res.set('Content-Type', 'text/html').send(html);
  }
}
