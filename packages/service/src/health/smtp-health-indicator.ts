import { Inject, Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { EmailService } from '../email';

@Injectable()
export class SmtpHealthIndicator extends HealthIndicator {
  private readonly log = new Logger(SmtpHealthIndicator.name);

  constructor(@Inject(EmailService) private readonly email: EmailService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.email.ping();
      return this.getStatus(key, true);
    } catch (error) {
      this.log.error('Failed to ping SMTP host', error);
      return this.getStatus(key, false);
    }
  }
}
