import { Controller, Get, Inject, Logger, Res } from '@nestjs/common';
import Mustache from 'mustache';
import { ApiService } from '../api';
import { PageOptions } from './page-options';
import { ViteService } from '../vite';
import { Config } from '../config';
import { Response } from 'express';
import { OriginalUrl } from './original-url.decorator';

const HtmlTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ appTitle }} | {{ pageTitle }}</title>
    {{ &head }}
  </head>
  <body>
    <div id="app">{{ &content }}</div>
    <script type="module" src="/src/entry-client.ts"></script>
    <script src="https://kit.fontawesome.com/0abec2fadd.js" crossorigin="anonymous"></script>
  </body>
</html>
`;

@Controller('/')
export class HomeController {
  private readonly log = new Logger(HomeController.name);

  constructor(
    @Inject(ViteService)
    private readonly vite: ViteService,
    @Inject(ApiService)
    private readonly apiClient: ApiService,
  ) {}

  @Get('*')
  async render(
    @OriginalUrl() url: string,
    @Res() res: Response,
  ): Promise<void> {
    this.log.debug(`Handling request for original URL: ${url}`);

    const html = await this.vite.transformHtml(url, HtmlTemplate);
    this.log.verbose('Transformed HTML:', html);

    const rendered = await this.vite.render();
    this.log.verbose('Rendered Vue Content:', rendered.html);

    const opts: PageOptions = {
      appTitle: Config.appTitle,
      pageTitle: 'Home',
      head: rendered.head ?? '',
      content: rendered.html,
    };

    const content = Mustache.render(html, opts);
    res.set('Content-Type', 'text/html').send(content);
  }
}
