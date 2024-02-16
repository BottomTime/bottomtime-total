import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CertificationsService } from '../certifications';

@Injectable()
export class AssertCertification implements CanActivate {
  constructor(
    @Inject(CertificationsService)
    private readonly certificationsService: CertificationsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const cert = await this.certificationsService.getCertification(
      req.params.certificationId,
    );

    if (!cert) {
      throw new NotFoundException(
        `Unable to find certification with ID "${req.params.certificationId}".`,
      );
    }

    req.targetCertification = cert;
    return true;
  }
}
