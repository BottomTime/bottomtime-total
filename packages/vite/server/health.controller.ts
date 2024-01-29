import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

const MemoryCheckThreshold = 2 * 1024 * 1024 * 1024; // 2GB

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(HttpHealthIndicator) private readonly http: HttpHealthIndicator,
    @Inject(MemoryHealthIndicator)
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return await this.health.check([
      // TODO: Ping backend
      () => this.http.pingCheck('api', 'http://localhost:4800/health'),
      () => this.memory.checkHeap('memory', MemoryCheckThreshold),
    ]);
  }
}
