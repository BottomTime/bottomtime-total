import {
  ApiList,
  CreateOrUpdateDiveSiteDTO,
  CreateOrUpdateDiveSiteSchema,
  DiveSiteDTO,
  DiveSitesSortBy,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesParamsSchema,
  SortOrder,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth, CurrentUser, User, UsersService } from '../users';
import { ValidateIds } from '../validate-ids.guard';
import { ZodValidator } from '../zod-validator';
import { AssertDiveSiteWrite } from './assert-dive-site-write.guard';
import { AssertDiveSite, TargetDiveSite } from './assert-dive-site.guard';
import { DiveSite } from './dive-site';
import { DiveSitesService } from './dive-sites.service';

const DiveSiteIdParam = 'siteId';

@Controller('api/diveSites')
export class DiveSitesController {
  private readonly log = new Logger(DiveSitesController.name);

  constructor(
    @Inject(DiveSitesService)
    private readonly diveSitesService: DiveSitesService,

    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  /**
   * @openapi
   * /api/diveSites:
   *   get:
   *     summary: Search dive sites
   *     operationId: searchDiveSites
   *     tags:
   *       - Dive Sites
   *     description: Search for or list dive sites.
   *     parameters:
   *       - in: query
   *         name: query
   *         description: A search string for performing a text-based search.
   *         schema:
   *           type: string
   *           example: Cenote Playa Del Carmen
   *       - in: query
   *         name: creator
   *         description: The username of the user who created the dive site. Use this to filter sites by creator.
   *         schema:
   *           type: string
   *           example: MarkDives33
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *           description: |
   *             GPS coordinates around which a location search will be performed. Must be formatted as `<latitude>,<longitude>`.
   *           example: 25.683875,-80.444647
   *       - in: query
   *         name: radius
   *         description: |
   *           Radius (in kilometers) of the search area.
   *           This parameter must be used in conjunction with the `location` parameter.
   *         schema:
   *           type: number
   *           min: 0
   *           max: 500
   *           default: 50
   *           example: 120
   *       - in: query
   *         name: rating
   *         description: |
   *           Range of rating to filter by. Only dive sites with an average rating within the range will be returned.
   *           Must be formatted as `<min>,<max>`.
   *         schema:
   *           type: string
   *           example: 3.0,5.0
   *       - in: query
   *         name: difficulty
   *         description: |
   *           Range of difficulty rating to filter by. Only dive sites with an average difficulty rating
   *           within the range will be returned. Must be formatted as `<min>,<max>`.
   *         schema:
   *           type: string
   *           example: 1.0,3.5
   *       - in: query
   *         name: freeToDive
   *         schema:
   *           type: boolean
   *           description: Whether the dive site is free to dive.
   *       - in: query
   *         name: shoreAccess
   *         description: Whether the dive site has shore access.
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: waterType
   *         description: Filter by the type of water at the dive site.
   *         schema:
   *           type: string
   *           enum:
   *             - salt
   *             - fresh
   *             - mixed
   *       - in: query
   *         name: sortBy
   *         description: The field to sort the search results by.
   *         schema:
   *           type: string
   *           enum:
   *             - name
   *             - rating
   *           default: rating
   *       - $ref: "#/components/parameters/SortOrder"
   *       - $ref: "#/components/parameters/Skip"
   *       - $ref: "#/components/parameters/Limit"
   *     responses:
   *       200:
   *         description: The dive sites that match the search criteria.
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
   *                 totalCount:
   *                   type: number
   *                   description: The total number of dive sites that match the search criteria.
   *       400:
   *         description: The request failed because the query string parameters are invalid.
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
  async searchDiveSites(
    @Query(new ZodValidator(SearchDiveSitesParamsSchema))
    options: SearchDiveSitesParamsDTO,
  ): Promise<ApiList<DiveSiteDTO>> {
    options.radius = options.radius ?? 50;
    options.skip = options.skip ?? 0;
    options.limit = options.limit ?? 50;
    options.sortBy = options.sortBy ?? DiveSitesSortBy.Rating;
    options.sortOrder = options.sortOrder ?? SortOrder.Descending;

    // The API specification says that the creator parameter should be a username, but the
    // underlying service expects an ID so we need to look up the user before invoking the
    // actual search.
    if (options.creator) {
      const creator = await this.usersService.getUserByUsernameOrEmail(
        options.creator,
      );

      if (!creator) {
        return {
          data: [],
          totalCount: 0,
        };
      }

      options.creator = creator.id;
    }

    this.log.debug('Searching dive sites', options);
    const results = await this.diveSitesService.searchDiveSites(options);
    return {
      data: results.data.map((site) => site.toJSON()),
      totalCount: results.totalCount,
    };
  }

  /**
   * @openapi
   * /api/diveSites:
   *   post:
   *     summary: Create a dive site
   *     operationId: createDiveSite
   *     tags:
   *       - Dive Sites
   *     description: Create a new dive site.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveSite"
   *     responses:
   *       201:
   *         description: The dive site was created successfully and will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSite"
   *       400:
   *         description: The request failed because the request body is invalid. See the response body for details.
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
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  @HttpCode(201)
  @UseGuards(AssertAuth)
  async createDiveSite(
    @CurrentUser() user: User,
    @Body(new ZodValidator(CreateOrUpdateDiveSiteSchema))
    options: CreateOrUpdateDiveSiteDTO,
  ): Promise<DiveSiteDTO> {
    this.log.debug('Attempting to create a new dive site', {
      creator: user.username,
      ...options,
    });
    const site = await this.diveSitesService.createDiveSite({
      creator: user,
      ...options,
    });
    this.log.log(`New dive site "${site.name}" created by "${user.username}".`);
    return site.toJSON();
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}:
   *   get:
   *     summary: Get a dive site
   *     operationId: getDiveSite
   *     tags:
   *       - Dive Sites
   *     description: Get a dive site by ID.
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *     responses:
   *       200:
   *         description: The dive site was retrieved successfully and will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSite"
   *       404:
   *         description: The request failed because the dive site with the specified ID was not found.
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
  @Get(`:${DiveSiteIdParam}`)
  @UseGuards(ValidateIds(DiveSiteIdParam), AssertDiveSite)
  getDiveSite(@TargetDiveSite() site: DiveSite): DiveSiteDTO {
    return site.toJSON();
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}:
   *   put:
   *     summary: Update a dive site
   *     operationId: updateDiveSite
   *     tags:
   *       - Dive Sites
   *     description: Update a dive site.
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveSite"
   *     responses:
   *       200:
   *         description: The dive site was updated successfully and will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSite"
   *       400:
   *         description: The request failed because the request body is invalid. See the response body for details.
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
   *         description: The request failed because the user is not authorized to update the dive site.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the dive site with the specified ID was not found.
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
  @Put(`:${DiveSiteIdParam}`)
  @UseGuards(
    ValidateIds(DiveSiteIdParam),
    AssertAuth,
    AssertDiveSite,
    AssertDiveSiteWrite,
  )
  async updateDiveSite(
    @TargetDiveSite() site: DiveSite,
    @Body(new ZodValidator(CreateOrUpdateDiveSiteSchema))
    options: CreateOrUpdateDiveSiteDTO,
  ): Promise<DiveSiteDTO> {
    site.name = options.name;
    site.description = options.description;
    site.depth = options.depth;
    site.location = options.location;
    site.directions = options.directions;
    site.gps = options.gps;
    site.freeToDive = options.freeToDive;
    site.shoreAccess = options.shoreAccess;
    site.waterType = options.waterType;

    await site.save();

    return site.toJSON();
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}:
   *   delete:
   *     summary: Delete a dive site
   *     operationId: deleteDiveSite
   *     tags:
   *       - Dive Sites
   *     description: Delete a dive site.
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *     responses:
   *       204:
   *         description: The dive site was deleted successfully.
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not authorized to delete the dive site.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the dive site with the specified ID was not found.
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
  @Delete(`:${DiveSiteIdParam}`)
  @HttpCode(204)
  @UseGuards(
    ValidateIds(DiveSiteIdParam),
    AssertAuth,
    AssertDiveSite,
    AssertDiveSiteWrite,
  )
  async deleteDiveSite(@TargetDiveSite() site: DiveSite): Promise<void> {
    await site.delete();
  }
}
