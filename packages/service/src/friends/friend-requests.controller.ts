import { Controller, Delete, Get, HttpCode, Put, Query } from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ListFriendRequestsParams,
  ListFriendRequestsParamsSchema,
  ListFriendRequestsResponseSchema,
} from '@bottomtime/api';
import { generateSchema } from '@anatine/zod-openapi';

const UsernameOrEmailApiParam: ApiParamOptions = {
  name: 'usernameOrEmail',
  description:
    'The username or email that uniquely identifies the user account.',
  example: 'harry_godgins53',
};

const FriendUsernameOrEmailApiParam: ApiParamOptions = {
  name: 'friendUsernameOrEmail',
  description:
    'The username or email that uniquely identifies the user to whome the friend request is addressed.',
  example: 'harry_godgins53',
};

@Controller('api/users/:usernameOrEmail/friendRequests')
@ApiTags('Friends')
@ApiUnauthorizedResponse({
  description: 'The request failed because the current user is not logged in.',
})
@ApiForbiddenResponse({
  description: `The request failed because the current user attempted to view or modify the friend requests of another user and is
    not an administrator. Alternatively, this can happen when a user attempts to accept a friend request addressed to another user.`,
})
@ApiNotFoundResponse({
  description:
    'The request failed because the friend request or user indicated in the request path could not be found.',
})
@ApiInternalServerErrorResponse({
  description: 'The request failed due to an internal server error.',
})
export class FriendRequestsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({
    summary: 'List Friend Requests',
    description:
      'Lists friend requests related to the user. Can be used to list incoming or out going requests, or both.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiQuery({
    schema: generateSchema(ListFriendRequestsParamsSchema.shape.direction),
    example: 'incoming',
    name: 'direction',
  })
  @ApiQuery({
    schema: generateSchema(ListFriendRequestsParamsSchema.shape.skip),
    name: 'skip',
    example: 50,
  })
  @ApiQuery({
    schema: generateSchema(ListFriendRequestsParamsSchema.shape.limit),
    name: 'limit',
    example: 20,
  })
  @ApiOkResponse({
    schema: generateSchema(ListFriendRequestsResponseSchema),
    description:
      'The request has successfully completed. The results will be in the response body.',
  })
  async listFriendRequests(@Query() options: ListFriendRequestsParams) {}

  @Put(':friendUsernameOrEmail')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Make Friend Request',
    description:
      'Creates a new friend request. The user who owns the target account will be notified.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiAcceptedResponse({
    description:
      'The friend request was created and the user to whom it was addressed will be notified.',
  })
  @ApiBadRequestResponse({
    description:
      'The request was rejected because there is already an active friend request addressed to the indicated user, or the users are already friends.',
  })
  async sendFriendRequest() {}

  @Put(':friendUsernameOrEmail')
  @ApiOperation({
    summary: 'Acknowledge Friend Request',
    description: 'Accepts or declines a friend request',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiNoContentResponse({
    description: 'Accepts or declines friend request',
  })
  async acknowledgeFriendRequest(): Promise<void> {}

  @Delete(':friendUsernameOrEmail')
  @ApiOperation({
    summary: 'Cancel Friend Request',
    description: 'Cancels (deletes) an existing friend request.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiNoContentResponse({
    description:
      'The request completed successfully and the friend request has been deleted/cancelled.',
  })
  async cancelFriendRequest() {}
}
