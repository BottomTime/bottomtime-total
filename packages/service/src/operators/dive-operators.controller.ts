import {
  CreateOrUpdateDiveOperatorDTO,
  CreateOrUpdateDiveOperatorSchema,
  DiveOperatorDTO,
  SearchDiveOperatorsParams,
  SearchDiveOperatorsResponseDTO,
  SearchDiveOperatorsSchema,
  TransferDiveOperatorOwnershipDTO,
  TransferDiveOperatorOwnershipSchema,
  VerifyDiveOperatorDTO,
  VerifyDiveOperatorSchema,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Head,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import slugify from 'slugify';

import {
  AssertAdmin,
  AssertAuth,
  CurrentUser,
  User,
  UsersService,
} from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertDiveOperatorOwner } from './assert-dive-operator-owner.guard';
import {
  AssertDiveOperator,
  CurrentDiveOperator,
} from './assert-dive-operator.guard';
import { DiveOperator } from './dive-operator';
import { DiveOperatorsService } from './dive-operators.service';

const OperatorKeyName = 'operatorKey';
const OperatorKeyParam = `:${OperatorKeyName}`;

@Controller('api/operators')
export class DiveOperatorsController {
  private readonly log = new Logger(DiveOperatorsController.name);

  constructor(
    @Inject(DiveOperatorsService)
    private readonly service: DiveOperatorsService,

    @Inject(UsersService)
    private readonly users: UsersService,
  ) {}

  /**
   * @openapi
   * /api/operators:
   *   get:
   *     summary: Search for dive operators
   *     operationId: searchDiveOperators
   *     description: |
   *       Performs a search for dive operators given the criteria specified in the query string.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - in: query
   *         name: query
   *         description: |
   *           A search query to perform a text-base search on. Will search within the operator's name, description, and address.
   *           If omitted, all dive operators will be matched by the search.
   *         required: false
   *         example: "Puget Sound"
   *         schema:
   *           type: string
   *       - in: query
   *         name: location
   *         description: |
   *           The GPS coordinates to use as the center of the search radius. Must be specified in the format `<latitude>,<longitude>`.
   *           If omitted, the search results will not be filtered on location.
   *         required: false
   *         example: 47.6062,-122.3321
   *         schema:
   *           type: string
   *       - in: query
   *         name: radius
   *         description: |
   *           The search radius in km about the search `location`. If the `location` parameter is omitted, this parameter will be ignored.
   *           The default is 50km.
   *         required: false
   *         example: 100
   *         schema:
   *           type: number
   *           format: float
   *           minimum: 10
   *           maximum: 500
   *           default: 50
   *       - in: query
   *         name: owner
   *         description: |
   *           The username of the dive operator's owner to filter the search results by. If omitted,
   *           all dive operators will be matched by the search.
   *         required: false
   *         example: "razmataz82"
   *         schema:
   *           type: string
   *           pattern: ^[a-z0-9_.-]+$
   *           minLength: 3
   *           maxLength: 50
   *       - in: query
   *         name: showInactive
   *         description: |
   *           Whether to include inactive dive operators (`active = false`) in the search results. Defaults to `false`.
   *         required: false
   *         example: true
   *       - in: query
   *         name: skip
   *         description: |
   *           The number of results to skip before returning the first result. Used for pagination.
   *           The default is 0.
   *         required: false
   *         example: 40
   *         schema:
   *           type: number
   *           format: int32
   *           minimum: 0
   *           default: 0
   *       - in: query
   *         name: limit
   *         description: |
   *           The maximum number of results to return. Used for pagination.
   *           The default is 50.
   *         required: false
   *         example: 20
   *         schema:
   *           type: number
   *           format: int32
   *           minimum: 1
   *           maximum: 500
   *           default: 50
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - operators
   *                 - totalCount
   *               properties:
   *                 operators:
   *                   type: array
   *                   name: Dive Operators
   *                   description: A list of dive operators that matched the search criteria.
   *                   items:
   *                     $ref: "#/components/schemas/DiveOperator"
   *                 totalCount:
   *                   type: integer
   *                   name: Total Count
   *                   description: The total number of results that matched the search criteria.
   *                   format: int32
   *       400:
   *         description: The request failed because the query string was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async searchDiveOperators(
    @Query(new ZodValidator(SearchDiveOperatorsSchema))
    options?: SearchDiveOperatorsParams,
  ): Promise<SearchDiveOperatorsResponseDTO> {
    this.log.debug(
      'Performing search for dive operators with search options:',
      options,
    );

    const owner = options?.owner
      ? await this.users.getUserByUsernameOrEmail(options.owner)
      : undefined;

    const results = await this.service.searchOperators({
      ...options,
      owner,
    });
    return {
      operators: results.operators.map((op) => op.toJSON()),
      totalCount: results.totalCount,
    };
  }

  /**
   * @openapi
   * /api/operators:
   *   post:
   *     summary: Create a new dive operator
   *     operationId: createDiveOperator
   *     description: |
   *       Creates a new dive operator with the specified details.
   *     tags:
   *       - Dive Operators
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveOperator"
   *     responses:
   *       201:
   *         description: The dive operator was successfully created and the details will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperator"
   *       400:
   *         description: The request failed because the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       409:
   *         description: The request failed because the slug is already in use by another dive operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  @UseGuards(AssertAuth)
  async createDiveOperator(
    @CurrentUser() owner: User,
    @Body(new ZodValidator(CreateOrUpdateDiveOperatorSchema))
    options: CreateOrUpdateDiveOperatorDTO,
  ): Promise<DiveOperatorDTO> {
    this.log.debug('Creating new dive operator:', options);

    const operator = await this.service.createOperator({
      ...options,
      owner,
    });

    this.log.log(
      `Created new dive operator: ${operator.name} (${operator.id})`,
    );

    return operator.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}:
   *   head:
   *     summary: Check if a dive operator exists
   *     operationId: diveOperatorExists
   *     description: |
   *       Checks if a dive operator with the specified key (slug) exists.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       200:
   *         description: The dive operator exists.
   *       404:
   *         description: The dive operator does not exist.
   *       500:
   *         description: The request failed because of an internal server error.
   */
  @Head(OperatorKeyName)
  async diveOperatorExists(@Param(OperatorKeyName) key: string): Promise<void> {
    const exists = await this.service.isSlugInUse(key);
    if (!exists) {
      throw new NotFoundException(
        `Dive operator with URL slug "${key}" does not exist.`,
      );
    }
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}:
   *   get:
   *     summary: Get a dive operator
   *     operationId: getDiveOperator
   *     description: |
   *       Retrieves a dive operator by its unique key (slug).
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       200:
   *         description: OK
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperator"
   *       404:
   *         description: The request failed because the dive operator was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(OperatorKeyParam)
  @UseGuards(AssertDiveOperator)
  getDiveOperator(
    @CurrentDiveOperator() operator: DiveOperator,
  ): DiveOperatorDTO {
    return operator.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}:
   *   put:
   *     summary: Update a dive operator
   *     operationId: updateDiveOperator
   *     description: |
   *       Updates a dive operator by its unique key (slug).
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveOperator"
   *     responses:
   *       200:
   *         description: The dive operator was successfully updated and the details will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperator"
   *       400:
   *         description: The request failed because the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not authorized to update the dive operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the dive operator was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(OperatorKeyParam)
  @UseGuards(AssertAuth, AssertDiveOperator, AssertDiveOperatorOwner)
  async updateDiveOperator(
    @CurrentDiveOperator() operator: DiveOperator,
    @Body(new ZodValidator(CreateOrUpdateDiveOperatorSchema))
    options: CreateOrUpdateDiveOperatorDTO,
  ): Promise<DiveOperatorDTO> {
    operator.active = options.active;
    operator.address = options.address;
    operator.description = options.description;
    operator.email = options.email;
    operator.gps = options.gps;
    operator.name = options.name;
    operator.phone = options.phone;
    operator.socials.facebook = options.socials?.facebook;
    operator.socials.instagram = options.socials?.instagram;
    operator.socials.tiktok = options.socials?.tiktok;
    operator.socials.twitter = options.socials?.twitter;
    operator.socials.youtube = options.socials?.youtube;
    operator.website = options.website;

    operator.slug =
      options.slug || slugify(options.name, { lower: true, trim: true });

    await operator.save();

    return operator.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}:
   *   delete:
   *     summary: Delete a dive operator
   *     operationId: deleteDiveOperator
   *     description: |
   *       Deletes a dive operator by its unique key (slug).
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     responses:
   *       204:
   *         description: The dive operator was successfully deleted.
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not authorized to delete the dive operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the dive operator was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(OperatorKeyParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertAuth, AssertDiveOperator, AssertDiveOperatorOwner)
  async deleteDiveOperator(
    @CurrentDiveOperator() operator: DiveOperator,
  ): Promise<void> {
    await operator.delete();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/transfer:
   *   post:
   *     summary: Transfer ownership of a dive operator
   *     operationId: transferDiveOperatorOwnership
   *     description: |
   *       Transfers ownership of a dive operator to another user.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newOwner
   *             properties:
   *               newOwner:
   *                 type: string
   *                 pattern: ^[a-z0-9_.-]+$
   *                 name: New Owner's Username
   *                 description: The username of the new owner to transfer ownership to.
   *                 example: SamSamuelson_23
   *                 minLength: 3
   *                 maxLength: 50
   *     responses:
   *       200:
   *         description: |
   *           The ownership of the dive operator was successfully transferred. The updated dive operator will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperator"
   *       400:
   *         description: The request failed because the new owner could not be found, or the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not authorized to transfer ownership of the dive operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the dive operator was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`${OperatorKeyParam}/transfer`)
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssertAuth, AssertDiveOperator, AssertDiveOperatorOwner)
  async transferDiveOperatorOwnership(
    @CurrentDiveOperator() operator: DiveOperator,
    @Body(new ZodValidator(TransferDiveOperatorOwnershipSchema))
    { newOwner: username }: TransferDiveOperatorOwnershipDTO,
  ): Promise<DiveOperatorDTO> {
    const newOwner = await this.users.getUserByUsernameOrEmail(username);
    if (!newOwner) {
      throw new BadRequestException(
        `Unable to transfer ownership to user "${username}". Username cannot be found.`,
      );
    }

    await operator.transferOwnership(newOwner);

    return operator.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/verify:
   *   post:
   *     summary: Verify or unverify a dive operator
   *     operationId: verifyDiveOperator
   *     description: |
   *       Verifies a dive operator, marking them as a verified dive operator.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - verified
   *             properties:
   *               verified:
   *                 type: boolean
   *                 name: Verified
   *                 description: Whether the dive operator is verified or not.
   *                 example: true
   *     responses:
   *       204:
   *         description: The dive operator was successfully verified/unverified.
   *       400:
   *         description: The request failed because the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an administrator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the dive operator was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`${OperatorKeyParam}/verify`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertAdmin, AssertDiveOperator)
  async verifyDiveOperator(
    @CurrentDiveOperator() operator: DiveOperator,
    @Body(new ZodValidator(VerifyDiveOperatorSchema))
    { verified }: VerifyDiveOperatorDTO,
  ): Promise<void> {
    if (verified) {
      await operator.verify();
    } else {
      await operator.unverify();
    }
  }
}
