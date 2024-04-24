import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CertificationsModule } from '../certifications';
import { UserEntity } from '../data';
import { FriendsModule } from '../friends';
import { TanksModule } from '../tanks';
import { UsersModule } from '../users';
import { AdminCertificationsController } from './admin-certifications.controller';
import { AdminFriendsController } from './admin-friends.controller';
import { AdminTanksController } from './admin-tanks.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    UsersModule,
    FriendsModule,
    CertificationsModule,
    TanksModule,
  ],
  providers: [AdminService],
  controllers: [
    AdminUsersController,
    AdminTanksController,
    AdminCertificationsController,
    AdminFriendsController,
  ],
  exports: [],
})
export class AdminModule {}
