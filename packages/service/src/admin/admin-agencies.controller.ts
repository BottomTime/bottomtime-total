import {
  AgencyDTO,
  CreateOrUpdateAgencyDTO,
  CreateOrUpdateAgencySchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AgenciesService, Agency } from '../certifications';
import {
  AssertTargetAgency,
  TargetAgency,
} from '../certifications/assert-target-agency.guard';
import { AssertAdmin } from '../users';
import { bodyValidator } from '../zod-validator';

const AgencyIdParam = ':agencyId';

@Controller('api/admin/agencies')
@UseGuards(AssertAdmin)
export class AdminAgenciesController {
  constructor(
    @Inject(AgenciesService) private readonly service: AgenciesService,
  ) {}

  /**
   * @openapi
   * /api/admin/agencies:
   *   post:
   *     summary: Create an agency
   *     operationId: createAgency
   *     description: Create a new certifying agency.
   *     tags:
   *       - Admin
   *       - Certifications
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateAgency"
   *     responses:
   *       "201":
   *         description: The request succeeded and the response body contains the newly created agency.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Agency"
   *       "400":
   *         description: The request failed because the request body was missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the requesting user does not have admin privileges.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: The request failed because an agency with the same name already exists.
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
  @Post()
  async createAgency(
    @Body(bodyValidator(CreateOrUpdateAgencySchema))
    options: CreateOrUpdateAgencyDTO,
  ): Promise<AgencyDTO> {
    const agency = await this.service.createAgency(options);
    return agency.toJSON();
  }

  /**
   * @openapi
   * /api/admin/agencies/{agencyId}:
   *   put:
   *     summary: Update an agency
   *     operationId: updateAgency
   *     description: Update an existing certifying agency.
   *     tags:
   *       - Admin
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/AgencyId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateAgency"
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body contains the updated agency.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Agency"
   *       "400":
   *         description: The request failed because the request body was missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the requesting user does not have admin privileges.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the specified agency could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: The request failed because an agency with the same name already exists.
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

  /**
   * @openapi
   * /api/admin/agencies/{agencyId}:
   *   delete:
   *     summary: Delete an agency
   *     operationId: deleteAgency
   *     description: Delete a certifying agency.
   *     tags:
   *       - Admin
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/AgencyId"
   *     responses:
   *       "204":
   *         description: The request succeeded and the response body is empty.
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the requesting user does not have admin privileges.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the specified agency could not be found.
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
  @Delete(AgencyIdParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertTargetAgency)
  async deleteAgency(@TargetAgency() agency: Agency): Promise<void> {
    await agency.delete();
  }
}
