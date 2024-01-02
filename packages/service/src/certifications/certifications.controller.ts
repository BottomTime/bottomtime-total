import { CertificationDTO } from '@bottomtime/api';
import { Controller, Get } from '@nestjs/common';
import { CertificationsService } from './certifications.service';

@Controller('api/certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Get()
  async searchCertifications(): Promise<CertificationDTO[]> {
    return [];
  }
}
