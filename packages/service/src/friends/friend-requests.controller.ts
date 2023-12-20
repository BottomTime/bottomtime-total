import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
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
  AcknowledgeFriendRequestParamsDTO,
  AcknowledgeFriendRequestParamsSchema,
  FriendRequestDTO,
  FriendRequestSchema,
  ListFriendRequestsParams,
  ListFriendRequestsParamsSchema,
  ListFriendRequestsResponseDTO,
  ListFriendRequestsResponseSchema,
  UserRole,
} from '@bottomtime/api';
import { generateSchema } from '@anatine/zod-openapi';
import { RequestValidator } from '../request-validator';
import { AssertAuth, CurrentUser } from '../auth';
import { User } from '../users/user';
import { UsersService } from '../users/users.service';

const UsernameOrEmailApiParam: ApiParamOptions = {
  name: 'user',
  description:
    'The username or email that uniquely identifies the user account.',
  example: 'harry_godgins53',
};

const FriendUsernameOrEmailApiParam: ApiParamOptions = {
  name: 'friend',
  description:
    'The username or email that uniquely identifies the user to whome the friend request is addressed.',
  example: 'harry_godgins53',
};

@Controller(`api/users/:${UsernameOrEmailApiParam.name}/friendRequests`)
@UseGuards(AssertAuth)
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
  private readonly log: Logger = new Logger(FriendRequestsController.name);

  private async loadUserData(
    currentUser: User,
    username: string,
    friendUsername?: string,
  ): Promise<{ user: User; friend?: User }> {
    this.log.debug(`Attempting to load user info for user "${username}"...`);
    const user = await this.usersService.getUserByUsernameOrEmail(username);
    if (!user) {
      throw new NotFoundException(
        `Unable to find user with username or email ${username}.`,
      );
    }

    if (currentUser.role !== UserRole.Admin && currentUser.id !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to view or modify the requested user account.',
      );
    }

    let friend: User | undefined = undefined;
    if (friendUsername) {
      this.log.debug(
        `Attempting to load user info for user "${friendUsername}...`,
      );
      friend = await this.usersService.getUserByUsernameOrEmail(friendUsername);
      if (!friend) {
        throw new NotFoundException(
          `Unable to find user with username or email ${friendUsername}.`,
        );
      }
    }

    return { user, friend };
  }

  constructor(
    private readonly friendsService: FriendsService,
    private readonly usersService: UsersService,
  ) {}

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
  async listFriendRequests(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name)
    usernameOrEmail: string,
    @Query(new RequestValidator(ListFriendRequestsParamsSchema))
    options: ListFriendRequestsParams,
  ): Promise<ListFriendRequestsResponseDTO> {
    const { user } = await this.loadUserData(currentUser, usernameOrEmail);

    const results = await this.friendsService.listFriendRequests({
      ...options,
      userId: user.id,
    });

    return results;
  }

  @Get(`:${FriendUsernameOrEmailApiParam.name}`)
  @ApiOperation({
    summary: 'Get Friend Request',
    description: 'Gets an existing friend request.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiOkResponse({
    schema: generateSchema(FriendRequestSchema),
    description:
      'The request completed successfully and the friend request is in the response body.',
  })
  async getFriendRequest(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name)
    usernameOrEmail: string,
    @Param(FriendUsernameOrEmailApiParam.name)
    friendUsernameOrEmail: string,
  ): Promise<FriendRequestDTO> {
    const { user, friend } = await this.loadUserData(
      currentUser,
      usernameOrEmail,
      friendUsernameOrEmail,
    );

    const friendRequest = await this.friendsService.getFriendRequest(
      user.id,
      friend!.id,
    );

    if (!friendRequest) {
      throw new NotFoundException(
        `Unable to find friend request from ${user.username} to ${
          friend!.username
        }.`,
      );
    }

    return friendRequest;
  }

  @Put(`:${FriendUsernameOrEmailApiParam.name}`)
  @HttpCode(201)
  @ApiOperation({
    summary: 'Make Friend Request',
    description:
      'Creates a new friend request. The user who owns the target account will be notified.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiCreatedResponse({
    description:
      'The friend request was created and the user to whom it was addressed will be notified.',
    schema: generateSchema(FriendRequestSchema),
  })
  @ApiConflictResponse({
    description:
      'The request was rejected because there is already an active friend request addressed to the indicated user, or the users are already friends.',
  })
  @ApiBadRequestResponse({
    description:
      'The request failed because the user attempted to send a friend request to themselves.',
  })
  async sendFriendRequest(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name)
    usernameOrEmail: string,
    @Param(FriendUsernameOrEmailApiParam.name)
    friendUsernameOrEmail: string,
  ): Promise<FriendRequestDTO> {
    const { user, friend } = await this.loadUserData(
      currentUser,
      usernameOrEmail,
      friendUsernameOrEmail,
    );

    const result = await this.friendsService.createFriendRequest(
      user.id,
      friend!.id,
    );
    return result;
  }

  @Post(`:${FriendUsernameOrEmailApiParam.name}/acknowledge`)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Acknowledge Friend Request',
    description: 'Accepts or declines a friend request',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiBody({
    schema: generateSchema(AcknowledgeFriendRequestParamsSchema),
    description: 'The friend request to acknowledge.',
  })
  @ApiNoContentResponse({
    description: 'Friend request has been accepted or declined.',
  })
  async acknowledgeFriendRequest(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name) usernameOrEmail: string,
    @Param(FriendUsernameOrEmailApiParam.name) friendUsernameOrEmail: string,
    @Body(new RequestValidator(AcknowledgeFriendRequestParamsSchema))
    params: AcknowledgeFriendRequestParamsDTO,
  ): Promise<void> {
    const { user, friend } = await this.loadUserData(
      currentUser,
      usernameOrEmail,
      friendUsernameOrEmail,
    );

    let success: boolean;

    if (params.accepted) {
      success = await this.friendsService.acceptFriendRequest(
        user.id,
        friend!.id,
      );
    } else {
      success = await this.friendsService.rejectFriendRequest(
        user.id,
        friend!.id,
        params.reason,
      );
    }

    if (!success) {
      throw new NotFoundException('Friend request was not found');
    }
  }

  @Delete(`:${FriendUsernameOrEmailApiParam.name}`)
  @HttpCode(204)
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
  async cancelFriendRequest(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name)
    usernameOrEmail: string,
    @Param(FriendUsernameOrEmailApiParam.name)
    friendUsernameOrEmail: string,
  ): Promise<void> {
    const { user, friend } = await this.loadUserData(
      currentUser,
      usernameOrEmail,
      friendUsernameOrEmail,
    );

    const success = await this.friendsService.cancelFriendRequest(
      user.id,
      friend!.id,
    );

    if (!success) {
      throw new NotFoundException('Friend request was not found');
    }
  }
}
