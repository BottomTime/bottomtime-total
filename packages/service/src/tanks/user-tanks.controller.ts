import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AssertTank } from './assert-tank';
import { generateSchema } from '@anatine/zod-openapi';
import {
  CreateOrUpdateTankParamsDTO,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  ListUserTanksParamsDTO,
  ListUserTanksParamsSchema,
  TankDTO,
  TankSchema,
} from '@bottomtime/api';
import { AssertAuth } from '../auth';
import { SelectedTank, TargetUser } from './tank.decorators';
import { Tank } from './tank';
import { User } from '../users/user';
import { ZodValidator } from '../zod-validator';
import { AssertTargetUser } from './assert-target-user.guard';

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

@Controller(`api/users/:${UsernameApiParam.name}/tanks`)
@UseGuards(AssertAuth, AssertTargetUser)
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
  @ApiQuery({
    name: 'includeSystem',
    type: 'boolean',
    description:
      'Whether or not to include system tanks in the list of tanks returned.',
    required: false,
  })
  @ApiOkResponse({
    schema: generateSchema(ListTanksResponseSchema),
    description:
      'The query was successful and the results will be in the response body.',
  })
  async listTanks(
    @Query(new ZodValidator(ListUserTanksParamsSchema))
    { includeSystem }: ListUserTanksParamsDTO,
    @TargetUser() targetUser: User,
  ): Promise<ListTanksResponseDTO> {
    const result = await this.tanksService.listTanks({
      userId: targetUser.id,
      includeSystem,
    });
    return {
      tanks: result.tanks.map((tank) => tank.toJSON()),
      totalCount: result.totalCount,
    };
  }

  @Get(`:${TankIdApiParam.name}`)
  @UseGuards(AssertTank)
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
  getTank(@SelectedTank() tank: Tank): TankDTO {
    return tank.toJSON();
  }

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
  async createTank(
    @TargetUser() targetUser: User,
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    const tank = await this.tanksService.createTank({
      ...options,
      userId: targetUser.id,
    });

    return tank.toJSON();
  }

  @Put(`:${TankIdApiParam.name}`)
  @UseGuards(AssertTank)
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
  async updateTank(
    @SelectedTank() tank: Tank,
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    tank.material = options.material;
    tank.name = options.name;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;
    await tank.save();

    return tank.toJSON();
  }

  @Delete(`:${TankIdApiParam.name}`)
  @HttpCode(204)
  @UseGuards(AssertTank)
  @ApiOperation({
    summary: 'Delete User Tank Profile',
    description: 'Delete an existing custom tank profile for the user.',
  })
  @ApiParam(UsernameApiParam)
  @ApiParam(TankIdApiParam)
  @ApiNoContentResponse({
    description: 'The tank profile was deleted successfully.',
  })
  async deleteTank(@SelectedTank() tank: Tank): Promise<void> {
    await tank.delete();
  }
}
