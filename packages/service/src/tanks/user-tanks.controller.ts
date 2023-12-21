import { Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { TanksService } from './tanks.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiParamOptions,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AssertTankOwner } from './assert-tank-owner.guard';
import { generateSchema } from '@anatine/zod-openapi';
import {
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseSchema,
  TankSchema,
} from '@bottomtime/api';

const UsernameApiParam: ApiParamOptions = {
  name: 'username',
  type: 'string',
  description:
    'The username or email that uniquely identifies the user that owns the tank profile.',
  required: true,
} as const;

const TankIdApiParam: ApiParamOptions = {
  name: 'tankId',
  description: 'The unique identifier for the tank profile.',
  type: 'string',
  format: 'uuid',
  required: true,
} as const;

@Controller('api/users/:username/tanks')
@UseGuards(AssertTankOwner)
@ApiTags('Users', 'Tanks')
@ApiUnauthorizedResponse({
  description:
    'The request failed because the user is not logged in or did not provide a valid token.',
})
@ApiForbiddenResponse({
  description:
    'The request failed because the user is not an administrator and does not own the requested tank profile.',
})
@ApiNotFoundResponse({
  description: 'The user or the requested tank profile does not exist.',
})
@ApiInternalServerErrorResponse({
  description: 'The request failed due to an internal server error.',
})
export class UserTanksController {
  constructor(private readonly tanksService: TanksService) {}

  @Get()
  @ApiOperation({
    summary: 'List User Tank Profiles',
    description: 'List all of the tank profiles defined by the user.',
  })
  @ApiParam(UsernameApiParam)
  @ApiOkResponse({
    schema: generateSchema(ListTanksResponseSchema),
    description:
      'The query was successful and the results will be in the response body.',
  })
  async listTanks(): Promise<void> {}

  @Get(':tankId')
  @ApiOperation({
    summary: 'Get User Tank Profile',
    description: 'Get the details of a tank profile defined by the user.',
  })
  @ApiParam(UsernameApiParam)
  @ApiParam(TankIdApiParam)
  @ApiOkResponse({
    schema: generateSchema(TankSchema),
    description:
      'The query was successful and the requested tank profile data will be in the response body.',
  })
  async getTank(): Promise<void> {}

  @Post()
  @ApiOperation({
    summary: 'Create User Tank Profile',
    description: 'Create a new custom tank profile for the user.',
  })
  @ApiParam(UsernameApiParam)
  @ApiBody({
    schema: generateSchema(CreateOrUpdateTankParamsSchema),
    description: 'The details of the tank profile to create.',
  })
  @ApiCreatedResponse({
    schema: generateSchema(TankSchema),
    description:
      'The tank profile was created successfully and will be returned in the response body.',
  })
  @ApiBadRequestResponse({
    description:
      'The request failed because the parameters provided in the request body were invalid or the maximum number of user-defined tanks (10) has been exceeded by the current user.',
  })
  async createTank(): Promise<void> {}

  @Put(':tankId')
  @ApiOperation({
    summary: 'Update User Tank Profile',
    description: 'Update an existing custom tank profile for the user.',
  })
  @ApiParam(UsernameApiParam)
  @ApiParam(TankIdApiParam)
  @ApiBody({
    schema: generateSchema(CreateOrUpdateTankParamsSchema),
    description: 'The updated details to apply to the tank profile.',
  })
  @ApiOkResponse({
    schema: generateSchema(TankSchema),
    description:
      'The tank profile was updated successfully and will newly-updated tank profile will be returned in the response body.',
  })
  @ApiBadRequestResponse({
    description:
      'The request failed because the parameters provided in the request body were invalid.',
  })
  async updateTank(): Promise<void> {}

  @Delete(':tankId')
  @ApiOperation({
    summary: 'Delete User Tank Profile',
    description: 'Delete an existing custom tank profile for the user.',
  })
  @ApiParam(UsernameApiParam)
  @ApiParam(TankIdApiParam)
  @ApiNoContentResponse({
    description: 'The tank profile was deleted successfully.',
  })
  async deleteTank(): Promise<void> {}
}
