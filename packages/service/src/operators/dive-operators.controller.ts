import {
  CreateOrUpdateDiveOperatorDTO,
  CreateOrUpdateDiveOperatorSchema,
  DiveOperatorDTO,
  SearchDiveOperatorsParams,
  SearchDiveOperatorsResponseDTO,
  SearchDiveOperatorsSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth, CurrentUser, User } from '../users';
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
   *                     $ref: "#/components/schemas/SuccinctDiveOperator"
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

    const results = await this.service.searchOperators(options);
    return {
      operators: results.operators.map((op) => op.toSuccinctJSON()),
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

  updateDiveOperator() {}

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

  transferDiveOperatorOwnership() {}

  verifyDiveOperator() {}
}
