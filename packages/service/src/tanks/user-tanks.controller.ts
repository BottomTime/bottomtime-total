import {
  CreateOrUpdateTankParamsDTO,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseDTO,
  ListUserTanksParamsDTO,
  ListUserTanksParamsSchema,
  TankDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth } from '../auth';
import { AssertTargetUser, TargetUser, User } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertTankPrivilege } from './assert-tank-privilege.guard';
import { AssertTank, SelectedTank } from './assert-tank.guard';
import { Tank } from './tank';
import { TanksService } from './tanks.service';

const UsernameParam = 'username';
const TankIdParam = 'tankId';

@Controller(`api/users/:${UsernameParam}/tanks`)
@UseGuards(AssertAuth, AssertTargetUser, AssertTankPrivilege)
export class UserTanksController {
  constructor(
    @Inject(TanksService) private readonly tanksService: TanksService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/tanks:
   *   get:
   *     tags:
   *       - Tanks
   *       - Users
   *     summary: List a user's tanks
   *     operationId: listTanks
   *     description: List the tanks belonging to a user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - name: includeSystem
   *         schema:
   *           type: boolean
   *         in: query
   *         description: Whether to include pre-defined system tanks in the results.
   *         required: false
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the list of tank profiles.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ListTanksResponse"
   *       401:
   *         description: The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the authenticated user does not have permission to access the requested user's tanks.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the requested user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
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

  /**
   * @openapi
   * /api/users/{username}/tanks/{tankId}:
   *   get:
   *     summary: Get Tank Profile
   *     operationId: getTank
   *     description: Retrieves a tank profile by its unique Id.
   *     tags:
   *       - Tanks
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/TankId"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the tank profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Tank"
   *       401:
   *         description: The request failed because the current user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the authenticated user does not have permission to access the requested user's tanks.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the requested user or tank does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because an unexpected internal server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(`:${TankIdParam}`)
  @UseGuards(AssertTank)
  getTank(@SelectedTank() tank: Tank): TankDTO {
    return tank.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/tanks:
   *   post:
   *     tags:
   *       - Tanks
   *       - Users
   *     summary: Create Tank Profile
   *     operationId: createTank
   *     description: Create a new tank profile for the specified user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The details of the tank profile to be created.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateTank"
   *     responses:
   *       201:
   *         description: The request succeeded and the response body will contain the newly created tank profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Tank"
   *       400:
   *         description: The request failed because the request body did not contain a valid tank profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the current user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the authenticated user does not have permission to access the requested user's tanks.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the requested user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because an unexpected internal server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
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

  /**
   * @openapi
   * /api/users/{username}/tanks/{tankId}:
   *   put:
   *     tags:
   *       - Tanks
   *       - Users
   *     summary: Update Tank Profile
   *     operationId: updateTank
   *     description: Update an existing tank profile.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/TankId"
   *     requestBody:
   *       description: The details of the tank profile to be updated.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateTank"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the updated tank profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Tank"
   *       400:
   *         description: The request failed because the request body did not contain a valid tank profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the current user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the authenticated user does not have permission to access the requested user's tanks.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the requested user or tank does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because an unexpected internal server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(`:${TankIdParam}`)
  @UseGuards(AssertTank)
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

  /**
   * @openapi
   * /api/users/{username}/tanks/{tankId}:
   *   delete:
   *     tags:
   *       - Tanks
   *       - Users
   *     summary: Delete Tank Profile
   *     operationId: deleteTank
   *     description: Delete an existing tank profile.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/TankId"
   *     responses:
   *       204:
   *         description: The request succeeded and the tank profile has been deleted.
   *       401:
   *         description: The request failed because the current user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the authenticated user does not have permission to access the requested user's tanks.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the requested user or tank does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because an unexpected internal server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(`:${TankIdParam}`)
  @HttpCode(204)
  @UseGuards(AssertTank)
  async deleteTank(@SelectedTank() tank: Tank): Promise<void> {
    await tank.delete();
  }
}
