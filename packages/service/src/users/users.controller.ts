import {
  Body,
  Controller,
  Get,
  Head,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ChangeEmailParams,
  ChangeEmailParamsSchema,
  ChangeUsernameParams,
  ChangeUsernameParamsSchema,
  CreateUserOptions,
  CreateUserOptionsSchema,
  ProfileDTO,
  ProfileSchema,
  SearchUsersParams,
  SearchUsersParamsSchema,
  SortOrder,
  UserDTO,
  UserSchema,
  UsersSortBy,
} from '@bottomtime/api';
import { RequestValidator } from '../request-validator';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';
import { AssertAuth, CurrentUser } from '../auth';
import { User } from './user';

const UsernameOrEmailParam: ApiParamOptions = {
  name: 'usernameOrEmail',
  description:
    'The username or email that uniquely identifies the user account.',
  example: 'dougy_fort33@gmail.com',
} as const;

@Controller('api/users')
@ApiTags('Users')
@ApiInternalServerErrorResponse({
  description: 'An internal server error has occurred',
})
export class UsersController {
  private readonly log = new Logger(UsersController.name);

  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Search User Profiles',
    description:
      'Searches for user profiles given the search criteria specified in the query string.',
  })
  @ApiQuery({
    name: 'query',
    description:
      'A query string to use to search for users. Usernames, emails, and profile info will be searched.',
    schema: generateSchema(SearchUsersParamsSchema.shape.query),
    example: 'billy',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'The field on which to sort the results.',
    schema: generateSchema(SearchUsersParamsSchema.shape.sortBy),
    example: UsersSortBy.Username,
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description:
      'The order in which to sort the results. (Ascending or descending)',
    schema: generateSchema(SearchUsersParamsSchema.shape.sortOrder),
    example: SortOrder.Ascending,
    required: false,
  })
  @ApiQuery({
    name: 'skip',
    description: 'The number of results to skip before returning results.',
    schema: generateSchema(SearchUsersParamsSchema.shape.skip),
    example: 250,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'The maximum number of results to return.',
    schema: generateSchema(SearchUsersParamsSchema.shape.limit),
    example: 100,
    required: false,
  })
  @ApiOkResponse({
    schema: generateSchema(ProfileSchema.array()),
    description:
      'The search has completed successfully. The results will be returned in the response body.',
  })
  @ApiBadRequestResponse({ description: 'The query string was invalid.' })
  async searchProfiles(
    @CurrentUser() user: User | undefined,
    @Query(new RequestValidator<SearchUsersParams>(SearchUsersParamsSchema))
    params: SearchUsersParams,
  ): Promise<ProfileDTO[]> {
    let profileVisibleTo: string | undefined;

    if (user) {
      if (user.role !== 'admin') {
        profileVisibleTo = user.username;
      }
    } else {
      profileVisibleTo = '#public';
    }

    const users = await this.users.searchUsers({
      ...params,
      profileVisibleTo,
    });
    return users.map((u) => u.profile.toJSON());
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create User',
    description: 'Creates a new user account.',
  })
  @ApiBody({ schema: generateSchema(CreateUserOptionsSchema) })
  @ApiCreatedResponse({
    description:
      'The new user account was successfully created. The account data will be returned in the response body.',
    schema: generateSchema(UserSchema),
  })
  @ApiBadRequestResponse({ description: 'The request body was invalid.' })
  @ApiForbiddenResponse({
    description:
      'User attempted to create a new account with elevated privileges but is not an administrator themselves.',
  })
  @ApiConflictResponse({
    description:
      'The request failed because the username or password is already taken.',
  })
  async createUser(
    @Body(new RequestValidator<CreateUserOptions>(CreateUserOptionsSchema))
    options: CreateUserOptions,
  ): Promise<UserDTO> {
    const user = await this.users.createUser(options);
    return user.toJSON();
  }

  @Head(':usernameOrEmail')
  @ApiOperation({
    summary: 'User Exists',
    description:
      'Test to see if a username or email is taken by an existing user.',
  })
  @ApiParam(UsernameOrEmailParam)
  @ApiOkResponse({
    description: 'A user with the provided username or password exists.',
  })
  @ApiNotFoundResponse({
    description:
      'A user with the provided username or password does not exist.',
  })
  async isUsernameOrEmailAvailable(
    @Param('usernameOrEmail') usernameOrEmail: string,
  ): Promise<void> {
    const user = await this.users.getUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      throw new NotFoundException('Username or email address was not found');
    }
  }

  // TODO: Test this
  async getUserProfile(
    @CurrentUser() currentUser: User | undefined,
    @Query() usernameOrEmail: string,
  ): Promise<ProfileDTO> {
    const user = await this.users.getUserByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }

    return user.profile.toJSON();
  }

  @Post(':usernameOrEmail/changeUsername')
  @UseGuards(AssertAuth)
  async changeUsername(
    @Param() usernameOrEmail: string,
    @Body(new RequestValidator(ChangeUsernameParamsSchema))
    { newUsername }: ChangeUsernameParams,
  ): Promise<void> {}

  @Post(':usernameOrEmail/changeEmail')
  @UseGuards(AssertAuth)
  async changeEmail(
    @Param() usernameOrEmail: string,
    @Body(new RequestValidator(ChangeEmailParamsSchema))
    { newEmail }: ChangeEmailParams,
  ): Promise<void> {}
}
