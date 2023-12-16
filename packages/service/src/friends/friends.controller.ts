import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
  ApiBadRequestResponse,
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
  FriendDTO,
  FriendSchema,
  FriendsSortBy,
  ListFriendsParams,
  ListFriendsParamsSchema,
  ListFriendsResponseDTO,
  ListFriendsResposneSchema,
  SortOrder,
  UserRole,
} from '@bottomtime/api';
import { AssertAuth, CurrentUser } from '../auth';
import { User } from '../users/user';
import { generateSchema } from '@anatine/zod-openapi';
import { RequestValidator } from '../request-validator';
import { UsersService } from '../users/users.service';

const UsernameOrEmailApiParam: ApiParamOptions = {
  name: 'usernameOrEmail',
  description:
    'The username or email that uniquely identifies the user account.',
  example: 'harry_godgins53',
};
const FriendUsernameOrEmailApiParam: ApiParamOptions = {
  name: 'friendUsernameOrEmail',
  description: "The username or email that identifies the user's friend.",
  example: 'ricky_bobby',
};

@Controller('api/users/:usernameOrEmail/friends')
@UseGuards(AssertAuth)
@ApiTags('Friends')
@ApiUnauthorizedResponse({
  description: 'The request was rejected because the user was not logged in.',
})
@ApiForbiddenResponse({
  description:
    'The request failed because a user attempted to view or modify a friend relationship that does not belong to them.',
})
@ApiNotFoundResponse({
  description:
    'The request failed because the user or the friend indicated in the request path could not be found.',
})
@ApiInternalServerErrorResponse({
  description: 'The request failed because of an internal server error.',
})
export class FriendsController {
  private readonly log: Logger = new Logger(FriendsController.name);

  constructor(
    private readonly friendsService: FriendsService,
    private readonly usersService: UsersService,
  ) {}

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

  /** LIST FRIENDS */
  @Get()
  @ApiOperation({
    summary: 'List Friends',
    description: 'Lists the friends associated with the indicated user.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiQuery({
    name: 'sortBy',
    description: 'The field to sort the results by.',
    schema: generateSchema(ListFriendsParamsSchema.shape.sortBy),
    example: FriendsSortBy.FriendsSince,
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'The order to sort the results by.',
    schema: generateSchema(ListFriendsParamsSchema.shape.sortOrder),
    example: SortOrder.Descending,
    required: false,
  })
  @ApiQuery({
    name: 'skip',
    description:
      'The number of records that should be skipped over before returning results.',
    schema: generateSchema(ListFriendsParamsSchema.shape.skip),
    example: 150,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'The maximum number of records to return in the response.',
    schema: generateSchema(ListFriendsParamsSchema.shape.limit),
    example: 50,
    required: false,
  })
  @ApiBadRequestResponse({
    description:
      'The request failed because the query parameters did not pass validation.',
  })
  @ApiOkResponse({
    schema: generateSchema(ListFriendsResposneSchema),
    description:
      'The request completed successfully. The results will be found in the response body.',
  })
  async listFriends(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name) username: string,
    @Query(new RequestValidator(ListFriendsParamsSchema))
    options: ListFriendsParams,
  ): Promise<ListFriendsResponseDTO> {
    const { user } = await this.loadUserData(currentUser, username);

    this.log.debug(
      `Executing query for friends of user ${user.username} with query options:`,
      options,
    );

    return this.friendsService.listFriends({
      ...options,
      userId: user.id,
    });
  }

  /** GET FRIEND */
  @Get(`:${FriendUsernameOrEmailApiParam.name}`)
  @ApiOperation({
    summary: 'Get Friend',
    description: 'Retrieves the friendship between two users.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiOkResponse({
    description:
      'The request completed successfully and the friend details are in the response body.',
    schema: generateSchema(FriendSchema),
  })
  async getFriend(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name) usernameOrEmail: string,
    @Param(FriendUsernameOrEmailApiParam.name) friendUsernameOrEmail: string,
  ): Promise<FriendDTO> {
    const { user, friend } = await this.loadUserData(
      currentUser,
      usernameOrEmail,
      friendUsernameOrEmail,
    );

    const friendData = await this.friendsService.getFriend(user.id, friend!.id);
    if (!friendData) {
      throw new NotFoundException('Users are not friends.');
    }

    return friendData;
  }

  /** UNFRIEND */
  @Delete(`:${FriendUsernameOrEmailApiParam.name}`)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Friendship',
    description:
      'Removes a friendship. The two users will no longer be friends.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam(FriendUsernameOrEmailApiParam)
  @ApiNoContentResponse({
    description: 'The operation has successfully completed.',
  })
  async removeFriend(
    @CurrentUser() currentUser: User,
    @Param(UsernameOrEmailApiParam.name) usernameOrEmail: string,
    @Param(FriendUsernameOrEmailApiParam.name) friendUsernameOrEmail: string,
  ): Promise<void> {
    const { user, friend } = await this.loadUserData(
      currentUser,
      usernameOrEmail,
      friendUsernameOrEmail,
    );

    const result = await this.friendsService.unFriend(user.id, friend!.id);
    if (!result) {
      throw new NotFoundException('Users are not friends.');
    }
  }
}
