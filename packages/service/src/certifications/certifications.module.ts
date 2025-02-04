import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AgencyEntity,
  CertificationEntity,
  UserProfessionalAssociationsEntity,
} from '../data';
import { UsersModule } from '../users';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { ProfessionalAssociationsController } from './professional-associations.controller';
import { ProfessionalAssociationsService } from './professional-associations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgencyEntity,
      CertificationEntity,
      UserProfessionalAssociationsEntity,
    ]),
    UsersModule,
  ],
  providers: [
    AgenciesService,
    CertificationsService,
    ProfessionalAssociationsService,
  ],
  controllers: [
    AgenciesController,
    CertificationsController,
    ProfessionalAssociationsController,
  ],
  exports: [
    AgenciesService,
    CertificationsService,
    ProfessionalAssociationsService,
  ],
})
export class CertificationsModule {}
