import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Express } from 'express';
import 'multer';

import { AssertAccountOwner } from './assert-account-owner.guard';
import { AssertTargetUser } from './assert-target-user.guard';

@Controller('/api/users/:username/avatar')
@UseGuards(AssertTargetUser, AssertAccountOwner)
export class UserAvatarController {
  @Get()
  async getAvatar(): Promise<void> {}

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() avatar: Express.Multer.File,
  ): Promise<void> {}
}
