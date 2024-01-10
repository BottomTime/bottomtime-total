import { Module } from '@nestjs/common';
import { CertificationsService } from './certifications.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CertificationModelName, CertificationSchema } from '../schemas';
import { CertificationsController } from './certifications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CertificationModelName, schema: CertificationSchema },
    ]),
  ],
  providers: [CertificationsService],
  controllers: [CertificationsController],
  exports: [CertificationsService],
})
export class CertificationsModule {}
