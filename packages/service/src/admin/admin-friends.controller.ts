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

  /**
   * @openapi
   * /api/admin/friendRequests:
   *   delete:
   *     summary: Purge expired friend requests
   *     operationId: purgeExpiredFriendRequests
   *     description: Deletes all friend requests that have expired
   *     tags:
   *       - Admin
   *       - Friends
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - expiration
   *             properties:
   *               expiration:
   *                 type: integer
   *                 format: int64
   *                 description: |
   *                   The date and time before which older friend requests will be deleted.
   *                   (Specified in milliseconds since Unix Epoch time.)
   *                 example: 1630000000000
   *     responses:
   *       200:
   *         description: The request succeeded and expired friend requests have been deleted.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - requestsDeleted
   *               properties:
   *                 requestsDeleted:
   *                   type: integer
   *                   description: The number of requests deleted in this purge operation.
   *                   example: 42
   */
  @Delete()
  async purgeExpiredFriendRequests(
    @Body(new ZodValidator(PurgeExpiredFriendRequestsParamsSchema))
    options: PurgeExpiredFriendRequestsParamsDTO,
  ): Promise<PurgeExpiredFriendRequestsResultsDTO> {
    this.log.log(
      `Purging expired friend requests with expiration ${new Date(
        options.expiration ?? Date.now(),
      )}`,
    );

    const requestsDeleted = await this.service.purgeExpiredFriendRequests(
      new Date(options.expiration ?? Date.now()),
    );
    return { requestsDeleted };
  }
}
