import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
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
  ListFriendsParams,
  ListFriendsParamsSchema,
  ListFriendsResponseDTO,
  ListFriendsResposneSchema,
} from '@bottomtime/api';
import { AssertAuth, CurrentUser } from '../auth';
import { User } from '../users/user';
import { generateSchema } from '@anatine/zod-openapi';
import { RequestValidator } from '../request-validator';

const UsernameOrEmailApiParam: ApiParamOptions = {
  name: 'usernameOrEmail',
  description:
    'The username or email that uniquely identifies the user account.',
  example: 'harry_godgins53',
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
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({
    summary: 'List Friends',
    description: 'Lists the friends associated with the indicated user.',
  })
  @ApiParam(UsernameOrEmailApiParam)
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
  @ApiOkResponse({
    schema: generateSchema(ListFriendsResposneSchema),
    description:
      'The request completed successfully. The results will be found in the response body.',
  })
  async listFriends(
    @CurrentUser() currentUser: User,
    @Query(new RequestValidator(ListFriendsParamsSchema))
    options: ListFriendsParams,
  ): Promise<ListFriendsResponseDTO> {
    return this.friendsService.listFriends({
      ...options,
      userId: currentUser.id,
    });
  }

  @Delete(':friendUsernameOrEmail')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete Friendship',
    description:
      'Removes a friendship. The two users will no longer be friends.',
  })
  @ApiParam(UsernameOrEmailApiParam)
  @ApiParam({
    name: 'friendUsernameOrEmail',
    description:
      "The username or email that identifies the user's soon-to-be former friend.",
    example: 'harry_godgins53',
  })
  @ApiNoContentResponse({
    description: 'The operation has successfully completed.',
  })
  async removeFriend(): Promise<void> {}
}
