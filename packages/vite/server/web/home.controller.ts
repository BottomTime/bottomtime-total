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
    if (this.vite) {
      this.log.debug('Rendering using Vite dev server...');
    }
    const rendered = await this.vite.render();

    return {
      appTitle: Config.appTitle,
      pageTitle: 'Home',
      content: rendered.html,
    };
  }
}
