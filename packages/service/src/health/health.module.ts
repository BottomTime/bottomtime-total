import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { EmailModule } from '../email';
import { HealthController } from './health.controller';
import { SmtpHealthIndicator } from './smtp-health-indicator';

@Module({
  imports: [
    TerminusModule.forRoot({ logger: false }),
    EmailModule.forFeature(),
  ],
  providers: [SmtpHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
