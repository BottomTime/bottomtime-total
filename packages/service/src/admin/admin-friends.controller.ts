import {
  PurgeExpiredFriendRequestsParamsDTO,
  PurgeExpiredFriendRequestsParamsSchema,
  PurgeExpiredFriendRequestsResultsDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Inject,
  Logger,
  UseGuards,
} from '@nestjs/common';

import { FriendsService } from '../friends';
import { AssertAdmin } from '../users';
import { ZodValidator } from '../zod-validator';

@Controller('api/admin/friendRequests')
@UseGuards(AssertAdmin)
export class AdminFriendsController {
  private readonly log = new Logger(AdminFriendsController.name);

  constructor(
    @Inject(FriendsService) private readonly service: FriendsService,
  ) {}

  @Delete()
  async purgeExpiredFriendRequests(
    @Body(new ZodValidator(PurgeExpiredFriendRequestsParamsSchema))
    { expiration }: PurgeExpiredFriendRequestsParamsDTO,
  ): Promise<PurgeExpiredFriendRequestsResultsDTO> {
    this.log.log(
      `Purging expired friend requests with expiration ${
        expiration ?? new Date()
      }`,
    );

    const requestsDeleted = await this.service.purgeExpiredFriendRequests(
      expiration,
    );
    return { requestsDeleted };
  }
}
