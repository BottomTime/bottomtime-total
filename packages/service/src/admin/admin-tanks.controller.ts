import {
  CreateOrUpdateTankParamsDTO,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseDTO,
  TankDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AssertAdmin, AssertAuth } from '../auth';
import { TanksService } from '../tanks/tanks.service';
import { ValidateIds } from '../validate-ids.guard';
import { ZodValidator } from '../zod-validator';

const TankIdParam = 'tankId';

@Controller('api/admin/tanks')
export class AdminTanksController {
  private readonly log = new Logger(AdminTanksController.name);

  constructor(
    @Inject(TanksService) private readonly tanksService: TanksService,
  ) {}

  /**
   * @openapi
   * /api/admin/tanks:
   *   get:
   *     summary: List Tanks
   *     operationId: listTanks
   *     description: |
   *       Lists all tanks.
   *     tags:
   *       - Admin
   *       - Tanks
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the list of tanks will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ListTanksResponse"
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  @UseGuards(AssertAuth)
  async listTanks(): Promise<ListTanksResponseDTO> {
    this.log.debug('Querying for tanks...');
    const tankData = await this.tanksService.listTanks();

    return {
      tanks: tankData.tanks.map((tank) => tank.toJSON()),
      totalCount: tankData.totalCount,
    };
  }

  /**
   * @openapi
   * /api/admin/tanks/{tankId}:
   *   get:
   *     summary: Get Tank
   *     operationId: getTank
   *     description: |
   *       Gets a tank by ID.
   *     tags:
   *       - Admin
   *       - Tanks
   *     parameters:
   *       - $ref: "#/components/parameters/TankId"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the tank will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Tank"
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request was rejected because the tank was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(`:${TankIdParam}`)
  @UseGuards(ValidateIds(TankIdParam), AssertAuth)
  async getTank(@Param(TankIdParam) tankId: string): Promise<TankDTO> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    return tank.toJSON();
  }

  /**
   * @openapi
   * /api/admin/tanks:
   *   post:
   *     summary: Create Tank
   *     operationId: createTank
   *     description: |
   *       Creates a new pre-defined tank profile.
   *     tags:
   *       - Admin
   *       - Tanks
   *     requestBody:
   *       description: The parameters to use when creating the tank.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateTank"
   *     responses:
   *       "201":
   *         description: |
   *           The request succeeded and the tank will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Tank"
   *       "400":
   *         description: The request was rejected because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  @HttpCode(201)
  @UseGuards(AssertAdmin)
  async createTank(
    @Body(new ZodValidator(CreateOrUpdateTankParamsSchema))
    options: CreateOrUpdateTankParamsDTO,
  ): Promise<TankDTO> {
    const tank = await this.tanksService.createTank(options);
    return tank.toJSON();
  }

  /**
   * @openapi
   * /api/admin/tanks/{tankId}:
   *   put:
   *     summary: Update Tank
   *     operationId: updateTank
   *     description: |
   *       Updates a pre-defined tank profile.
   *     tags:
   *       - Admin
   *       - Tanks
   *     parameters:
   *       - $ref: "#/components/parameters/TankId"
   *     requestBody:
   *       description: The parameters to use when updating the tank.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateTank"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the tank will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Tank"
   *       "400":
   *         description: The request was rejected because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request was rejected because the tank was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(`:${TankIdParam}`)
  @UseGuards(ValidateIds(TankIdParam), AssertAdmin)
  async updateTank(
    @Param(TankIdParam) tankId: string,
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

  /**
   * @openapi
   * /api/admin/tanks/{tankId}:
   *   delete:
   *     summary: Delete Tank
   *     operationId: deleteTank
   *     description: |
   *       Deletes a pre-defined tank profile.
   *     tags:
   *       - Admin
   *       - Tanks
   *     parameters:
   *       - $ref: "#/components/parameters/TankId"
   *     responses:
   *       "204":
   *         description: |
   *           The request succeeded and the tank was deleted.
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request was rejected because the tank was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(`:${TankIdParam}`)
  @HttpCode(204)
  @UseGuards(ValidateIds(TankIdParam), AssertAdmin)
  async deleteTank(@Param('tankId') tankId: string): Promise<void> {
    const tank = await this.tanksService.getTank(tankId);

    if (!tank) {
      throw new NotFoundException(`Tank with ID "${tankId}" not found.`);
    }

    await tank.delete();
  }
}
