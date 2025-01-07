import {
  ApiList,
  AttachDiveSitesResponseDTO,
  DiveSiteDTO,
  DiveSiteIdsParamsDTO,
  DiveSiteIdsParamsSchema,
  ListOperatorDiveSitesParams,
  ListOperatorDiveSitesParamsSchema,
  RemoveDiveSitesResponseDTO,
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

import { DiveSitesService } from '../diveSites';
import { AssertAuth } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertOperatorOwner } from './assert-operator-owner.guard';
import { AssertOperator, TargetOperator } from './assert-operator.guard';
import { Operator } from './operator';

@Controller('api/operators/:operatorKey/sites')
@UseGuards(AssertOperator)
export class OperatorSitesController {
  private readonly log = new Logger(OperatorSitesController.name);

  constructor(
    @Inject(DiveSitesService) private readonly sites: DiveSitesService,
  ) {}

  /**
   * @openapi
   * /api/operators/{operatorKey}/sites:
   *   get:
   *     summary: List dive sites for an operator
   *     operationId: listOperatorDiveSites
   *     description: |
   *       Retrieves a list of dive sites associated with a dive operator.
   *     tags:
   *       - Dive Operators
   *     parameters:
   *       - $ref: "#/components/parameters/DiveOperatorKey"
   *       - in: query
   *         name: skip
   *         description: The number of dive sites to skip before returning results. Used for pagination.
   *         schema:
   *           type: number
   *           format: int32
   *           minimum: 0
   *           default: 0
   *       - in: query
   *         name: limit
   *         description: The maximum number of dive sites to return. Used for pagination.
   *         schema:
   *           type: number
   *           format: int32
   *           minimum: 1
   *           default: 50
   *           maximum: 200
   *     responses:
   *       "200":
   *         description: The request succeeded and a list of associated dive sites will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/DiveSite"
   *                   description: The list of dive sites associated with the operator.
   *                 totalCount:
   *                   type: number
   *                   format: int32
   *                   description: The total number of dive sites associated with the operator.
   *       "400":
   *         description: The request was rejected because the query string was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the indicated operator does not exist.
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
  async listDiveSites(
    @TargetOperator() operator: Operator,
    @Query(new ZodValidator(ListOperatorDiveSitesParamsSchema))
    options: ListOperatorDiveSitesParams,
  ): Promise<ApiList<DiveSiteDTO>> {
    const sites = await operator.sites.listSites(options);
    return {
      data: sites.data.map((site) => site.toJSON()),
      totalCount: sites.totalCount,
    };
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/sites:
   *   post:
   *     summary: Add dive sites to an operator
   *     operationId: addDiveSites
   *     description: |
   *       Adds a list of dive sites to an operator's profile. The operator must be the owner of the dive site to add it to their profile.
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
   *               - siteIds
   *             properties:
   *               siteIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                   example: 10bfa5b3-d8ce-498e-89c4-85b3774c2837
   *                 minItems: 1
   *                 maxItems: 500
   *                 description: A list of dive site IDs to add to the operator's profile.
   *     responses:
   *       "200":
   *         description: The request succeeded and the dive sites were added to the operator's profile.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - attached
   *                 - skipped
   *               properties:
   *                 attached:
   *                   type: number
   *                   format: int32
   *                   description: The number of dive sites that were successfully added to the operator's profile.
   *                 skipped:
   *                   type: number
   *                   format: int32
   *                   description: |
   *                     The number of dive sites that were not added to the operator's profile. This could be due to the site ID not
   *                     being found or the site already being associated with the operator.
   *       "400":
   *         description: The request was rejected because the request body was missing or invalid.
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
   *         description: The request was rejected because the user is not authorized to modify the operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the indicated operator does not exist.
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
  @HttpCode(HttpStatus.OK)
  @UseGuards(AssertAuth, AssertOperatorOwner)
  async addDiveSites(
    @TargetOperator() operator: Operator,
    @Body(new ZodValidator(DiveSiteIdsParamsSchema))
    { siteIds }: DiveSiteIdsParamsDTO,
  ): Promise<AttachDiveSitesResponseDTO> {
    this.log.debug(
      `Adding dive ${siteIds.length} sites to operator: ${siteIds.join(', ')}`,
    );
    const sites = await this.sites.getDiveSites(siteIds);

    this.log.debug(
      `Found ${sites.length} matches. Binding sites to operator...`,
    );
    const attached = await operator.sites.addSites(sites);

    return {
      attached,
      skipped: siteIds.length - attached,
    };
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/sites:
   *   delete:
   *     summary: Remove dive sites from an operator
   *     operationId: removeDiveSites
   *     description: |
   *       Removes a list of dive sites from an operator's profile. The operator must be the owner of the dive site to remove it from their profile.
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
   *               - siteIds
   *             properties:
   *               siteIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                   example: 10bfa5b3-d8ce-498e-89c4-85b3774c2837
   *                 minItems: 1
   *                 maxItems: 500
   *                 description: A list of dive site IDs to remove from the operator's profile.
   *     responses:
   *       "200":
   *         description: The request succeeded and the dive sites were removed from the operator's profile.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - removed
   *                 - skipped
   *               properties:
   *                 removed:
   *                   type: number
   *                   format: int32
   *                   description: The number of dive sites that were successfully removed from the operator's profile.
   *                 skipped:
   *                   type: number
   *                   format: int32
   *                   description: |
   *                     The number of dive sites that were not removed from the operator's profile. This could be due to the site ID not
   *                     being found or the site not being associated with the operator.
   *       "400":
   *         description: The request was rejected because the request body was missing or invalid.
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
   *         description: The request was rejected because the user is not authorized to modify the operator.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the indicated operator does not exist.
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
  @Delete()
  @UseGuards(AssertAuth, AssertOperatorOwner)
  async removeDiveSites(
    @TargetOperator() operator: Operator,
    @Body(new ZodValidator(DiveSiteIdsParamsSchema))
    { siteIds }: DiveSiteIdsParamsDTO,
  ): Promise<RemoveDiveSitesResponseDTO> {
    const removed = await operator.sites.removeSites(siteIds);
    return {
      removed,
      skipped: siteIds.length - removed,
    };
  }
}
