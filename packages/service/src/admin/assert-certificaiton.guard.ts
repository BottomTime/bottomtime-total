import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { Certification, CertificationsService } from '../certifications';

@Injectable()
export class AssertCertification implements CanActivate {
  constructor(
    @Inject(CertificationsService)
    private readonly certificationsService: CertificationsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
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

export const TargetCertification = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Certification | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetCertification;
  },
);
