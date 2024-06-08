import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { URL } from 'url';

import { Config } from './config';

const MemoryCheckThreshold = 2 * 1024 * 1024 * 1024; // 2GB

@Controller('health')
export class HealthController {
  private readonly apiPingUrl: string;

  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(HttpHealthIndicator) private readonly http: HttpHealthIndicator,
    @Inject(MemoryHealthIndicator)
    private readonly memory: MemoryHealthIndicator,
  ) {
    this.apiPingUrl = new URL('/health', Config.apiUrl).toString();
  }

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return await this.health.check([
      () => this.http.pingCheck('api', this.apiPingUrl),
      () => this.memory.checkHeap('memory', MemoryCheckThreshold),
    ]);
  }
}
