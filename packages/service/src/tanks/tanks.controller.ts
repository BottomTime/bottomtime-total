import {
  Controller,
  Delete,
  Get,
  HttpCode,
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
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseSchema,
  TankSchema,
} from '@bottomtime/api';

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
  async listTanks(): Promise<void> {}

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
  async getTank(): Promise<void> {}

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
  async createTank(): Promise<void> {}

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
  async updateTank(): Promise<void> {}

  @Delete(':tankId')
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
  async deleteTank(): Promise<void> {}
}
