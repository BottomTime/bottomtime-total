import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CertificationEntity } from '../data';
import { CertificationModelName, CertificationSchema } from '../schemas';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CertificationModelName, schema: CertificationSchema },
    ]),
    TypeOrmModule.forFeature([CertificationEntity]),
  ],
  providers: [CertificationsService],
  controllers: [CertificationsController],
  exports: [CertificationsService],
})
export class CertificationsModule {}
