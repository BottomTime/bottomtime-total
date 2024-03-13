import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CertificationsModule } from '../certifications';
import { UserEntity } from '../data';
import { TanksModule } from '../tanks';
import { UsersModule } from '../users';
import { AdminCertificationsController } from './admin-certifications.controller';
import { AdminTanksController } from './admin-tanks.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
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
