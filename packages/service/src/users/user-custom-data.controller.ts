import { JsonDataDTO, JsonSchema } from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth, User } from '../auth';
import { ZodValidator } from '../zod-validator';
import { AssertAccountOwner } from './assert-account-owner.guard';
import { AssertTargetUser, TargetUser } from './assert-target-user.guard';
import { UserCustomDataService } from './user-custom-data.service';

@Controller('/api/users/:username/customData')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
export class UserCustomDataController {
  constructor(
    @Inject(UserCustomDataService)
    private readonly service: UserCustomDataService,
  ) {}

  @Get()
  async listKeys(@TargetUser() user: User): Promise<string[]> {
    return await this.service.listKeys(user.id);
  }

  @Get(':key')
  async getItem(
    @TargetUser() user: User,
    @Param('key') key: string,
  ): Promise<JsonDataDTO> {
    const data = await this.service.getItem(user.id, key);
    if (data === undefined) {
      throw new NotFoundException(`Unable to find data blob with key "${key}"`);
    }

    return data;
  }

  @Put(':key')
  async setItem(
    @TargetUser() user: User,
    @Param('key') key: string,
    @Body(new ZodValidator(JsonSchema)) value: JsonDataDTO,
  ): Promise<JsonDataDTO> {
    await this.service.setItem(user.id, key, value);
    return value;
  }

  @Delete(':key')
  @HttpCode(204)
  async deleteItem(
    @TargetUser() user: User,
    @Param('key') key: string,
  ): Promise<void> {
    const succeded = await this.service.removeItem(user.id, key);
    if (!succeded) {
      throw new NotFoundException(`Unable to find data blob with key "${key}"`);
    }
  }
}
