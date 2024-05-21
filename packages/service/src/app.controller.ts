import { AppMetricsDTO, PingResponseDTO } from '@bottomtime/api';

import { Controller, Get, Inject } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly service: AppService) {}

  @Get()
  getPing(): PingResponseDTO {
    return {
      api: 'Bottom Time Service',
      apiVersion: '1.0.0',
      uptime: Math.ceil(process.uptime() * 1000),
    };
  }

  @Get('api/metrics')
  async getMetrics(): Promise<AppMetricsDTO> {
    return await this.service.getMetrics();
  }
}
