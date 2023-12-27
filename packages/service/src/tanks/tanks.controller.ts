import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AssertAdmin, AssertAuth } from '../auth';
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
import { generateSchema } from '@anatine/zod-openapi';
import {
  CreateOrUpdateTankParamsDTO,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseDTO,
  ListTanksResponseSchema,
  TankDTO,
  TankSchema,
} from '@bottomtime/api';
import { TanksService } from './tanks.service';
import { ZodValidator } from '../zod-validator';

const TankIdApiParam: ApiParamOptions = {
  name: 'tankId',
  description: 'The unique identifier for the tank.',
  type: 'string',
  format: 'uuid',
} as const;

@Controller('api/tanks')
@ApiTags('Tanks')
@ApiUnauthorizedResponse({
  description:
    'The request failed because the user is not logged in or did not provide a valid token.',
})
@ApiInternalServerErrorResponse({
  description: 'The request failed due to an internal server error.',
})
export class TanksController {
  constructor(private readonly tanksService: TanksService) {}

  @Get()
  @UseGuards(AssertAuth)
  @ApiOperation({
    summary: 'List Tank Profiles',
    description: 'List all of the global, pre-defined tank profiles.',
  })
  @ApiOkResponse({
    schema: generateSchema(ListTanksResponseSchema),
    description:
      'The query was successful and the results will be in the response body.',
  })
  async listTanks(): Promise<ListTanksResponseDTO> {
    const tankData = await this.tanksService.listTanks();
    return {
      tanks: tankData.tanks.map((tank) => tank.toJSON()),
      totalCount: tankData.totalCount,
    };
  }

  @Get(':tankId')
  @UseGuards(AssertAuth)
  @ApiOperation({
    summary: 'Get Tank Profile',
    description: 'Retrieve a single global tank profile by its ID.',
  })
  @ApiParam(TankIdApiParam)
  @ApiOkResponse({
    schema: generateSchema(TankSchema),
    description:
      'The query was successful and the result will be in the response body.',
  })
  @ApiNotFoundResponse({
    description:
      'The request failed because the indicated tank ID could not be found.',
  })
  async getTank(@Param(TankIdApiParam.name) tankId: string): Promise<TankDTO> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    return tank.toJSON();
  }

  @Post()
  @HttpCode(201)
  @UseGuards(AssertAdmin)
  @ApiOperation({
    summary: 'Create Tank Profile',
    description: 'Create a new tank profile that anyone can use.',
  })
  @ApiBody({
    schema: generateSchema(CreateOrUpdateTankParamsSchema),
    description: 'The new tank profile.',
  })
  @ApiCreatedResponse({
    schema: generateSchema(TankSchema),
    description:
      'The new tank profile was successfully created and will be returned in the response body.',
  })
  @ApiBadRequestResponse({
    description:
      'The request failed because the tank profile data was invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The request failed because the user is not an administrator.',
  })
  async createTank(
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    const tank = await this.tanksService.createTank(options);
    return tank.toJSON();
  }

  @Put(':tankId')
  @UseGuards(AssertAdmin)
  @ApiOperation({
    summary: 'Update Tank Profile',
    description: 'Updates a single global tank profile by its ID.',
  })
  @ApiParam(TankIdApiParam)
  @ApiBody({
    schema: generateSchema(CreateOrUpdateTankParamsSchema),
    description: 'The updated values for the tank profile.',
  })
  @ApiOkResponse({
    schema: generateSchema(TankSchema),
    description:
      'The tank profile was successfully updated and the new data is returned in the response body.',
  })
  @ApiBadRequestResponse({
    description:
      'The request failed because the tank profile data was invalid.',
  })
  @ApiForbiddenResponse({
    description: 'The request failed because the user is not an administrator.',
  })
  @ApiNotFoundResponse({
    description:
      'The request failed because the indicated tank ID could not be found.',
  })
  async updateTank(
    @Param(TankIdApiParam.name) tankId: string,
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    tank.material = options.material;
    tank.name = options.name;
    tank.volume = options.volume;
    tank.workingPressure = options.workingPressure;
    await tank.save();

    return tank.toJSON();
  }

  @Delete(':tankId')
  @HttpCode(204)
  @UseGuards(AssertAdmin)
  @ApiOperation({
    summary: 'Delete Tank Profile',
    description: 'Deletes a single global tank profile by its ID.',
  })
  @ApiParam(TankIdApiParam)
  @ApiNoContentResponse({
    description: 'The tank profile was successfully deleted.',
  })
  @ApiForbiddenResponse({
    description: 'The request failed because the user is not an administrator.',
  })
  @ApiNotFoundResponse({
    description:
      'The request failed because the indicated tank ID could not be found.',
  })
  async deleteTank(@Param(TankIdApiParam.name) tankId: string): Promise<void> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    await tank.delete();
  }
}
