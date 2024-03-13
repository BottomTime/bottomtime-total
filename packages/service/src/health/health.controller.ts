import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
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

    @Inject(TypeOrmHealthIndicator)
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () => this.memory.checkRSS('memory-usage', 200 * 1024 * 1024), // 200MB - Tune as needed
      async () => this.smtp.isHealthy('smtp'),
      async () => this.db.pingCheck('posgressql'),
    ]);
  }
}
