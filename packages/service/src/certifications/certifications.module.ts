import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgencyEntity, CertificationEntity } from '../data';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgencyEntity, CertificationEntity])],
  providers: [AgenciesService, CertificationsService],
  controllers: [AgenciesController, CertificationsController],
  exports: [AgenciesService, CertificationsService],
})
export class CertificationsModule {}
