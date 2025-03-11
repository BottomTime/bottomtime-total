import {
  AgencyDTO,
  ApiList,
  CreateOrUpdateAgencyDTO,
  CreateOrUpdateAgencySchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { bodyValidator } from '../zod-validator';
import { AgenciesService } from './agencies.service';
import { Agency } from './agency';
import { AssertTargetAgency, TargetAgency } from './assert-target-agency.guard';

const AgencyIdParam = ':agencyId';

@Controller('api/agencies')
export class AgenciesController {
  constructor(
    @Inject(AgenciesService) private readonly service: AgenciesService,
  ) {}

  /**
   * @openapi
   * /api/agencies:
   *   get:
   *     summary: List agencies
   *     operationId: listAgencies
   *     description: Retrieve a list of certifying agencies.
   *     tags:
   *       - Certifications
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body contains the results.
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
   *                   title: Agencies
   *                   description: An array of agencies.
   *                   items:
   *                     $ref: "#/components/schemas/Agency"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   description: The total number of agencies matching the search criteria.
   *                   example: 17
   *       "500":
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listAgencies(): Promise<ApiList<AgencyDTO>> {
    const { data, totalCount } = await this.service.listAgencies();
    return { data: data.map((agency) => agency.toJSON()), totalCount };
  }

  /**
   * @openapi
   * /api/agencies/{agencyId}:
   *   get:
   *     summary: Get an agency
   *     operationId: getAgency
   *     description: Retrieve a single certifying agency by its ID.
   *     tags:
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/AgencyId"
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body contains the agency.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Agency"
   *       "404":
   *         description: The request failed because the agency with the specified ID was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(AgencyIdParam)
  @UseGuards(AssertTargetAgency)
  async getAgency(@TargetAgency() agency: Agency): Promise<AgencyDTO> {
    return agency.toJSON();
  }

  @Post()
  async createAgency(
    @Body(bodyValidator(CreateOrUpdateAgencySchema))
    options: CreateOrUpdateAgencyDTO,
  ): Promise<AgencyDTO> {
    const agency = await this.service.createAgency(options);
    return agency.toJSON();
  }

  @Put(AgencyIdParam)
  @UseGuards(AssertTargetAgency)
  async updateAgency(
    @TargetAgency() agency: Agency,
    @Body(bodyValidator(CreateOrUpdateAgencySchema))
    options: CreateOrUpdateAgencyDTO,
  ): Promise<AgencyDTO> {
    agency.logo = options.logo;
    agency.longName = options.longName;
    agency.name = options.name;
    agency.website = options.website;
    await agency.save();
    return agency.toJSON();
  }

  @Delete(AgencyIdParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertTargetAgency)
  async deleteAgency(@TargetAgency() agency: Agency): Promise<void> {
    await agency.delete();
  }
}
