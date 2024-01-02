import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUsersController } from './admin-users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../schemas';
import { UsersModule } from '../users';
import { AdminTanksController } from './admin-tanks.controller';
import { TanksModule } from '../tanks';
import { Collections } from '../data';
import { CertificationsModule } from '../certifications';
import { AdminCertificationsController } from './admin-certifications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.Users, schema: UserSchema },
    ]),
    UsersModule,
    CertificationsModule,
    TanksModule,
  ],
  providers: [AdminService],
  controllers: [
    AdminUsersController,
    AdminTanksController,
    AdminCertificationsController,
  ],
  exports: [],
})
export class AdminModule {}
