import {
  Body,
  Controller,
  Head,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserOptions,
  CreateUserOptionsSchema,
  UserDTO,
  UserSchema,
} from '@bottomtime/api';
import { RequestValidator } from '../request-validator';
import {
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
  ApiTags,
} from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';

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
}
