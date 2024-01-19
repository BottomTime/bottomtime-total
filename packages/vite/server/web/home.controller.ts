import { Controller, Get, Inject, Logger, Render } from '@nestjs/common';
import { ApiService } from '../api';
import { PageOptions } from './page-options';
import { ViteService } from '../vite';
import { Config } from '../config';

@Controller('/')
export class HomeController {
  private readonly log = new Logger(HomeController.name);

  constructor(
    @Inject(ViteService)
    private readonly vite: ViteService,
    @Inject(ApiService)
    private readonly apiClient: ApiService,
  ) {}

  @Get()
  @Render('index')
  async index(): Promise<PageOptions> {
    const rendered = await this.vite.render();

    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Vue + TS</title>
    <!--app-head-->
  </head>
  <body>
    <div id="app"><!--app-html--></div>
    <script type="module" src="/src/entry-client.ts"></script>
  </body>
</html>`;

    const transformed = await this.vite.transformHtml(html);
    this.log.debug(`Transformed HTML: ${transformed}`);

    return {
      appTitle: Config.appTitle,
      pageTitle: 'Home',
      head: rendered.head ?? '',
      content: rendered.html,
    };
  }
}
