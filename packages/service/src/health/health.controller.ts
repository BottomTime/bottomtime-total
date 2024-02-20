import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

import { SmtpHealthIndicator } from './smtp-health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService)
    private readonly health: HealthCheckService,

    @Inject(SmtpHealthIndicator)
    private readonly smtp: SmtpHealthIndicator,

    @Inject(MemoryHealthIndicator)
    private readonly memory: MemoryHealthIndicator,

    @Inject(MongooseHealthIndicator)
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () => this.memory.checkRSS('memory-usage', 200 * 1024 * 1024), // 200MB - Tune as needed
      async () => this.mongoose.pingCheck('mongodb'),
      async () => this.smtp.isHealthy('smtp'),
    ]);
  }
}
