import {
  ApiList,
  CertificationDTO,
  CreateOrUpdateCertificationParamsDTO,
  CreateOrUpdateCertificationParamsSchema,
  SearchCertificationsParamsDTO,
  SearchCertificationsParamsSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AgenciesService,
  Certification,
  CertificationsService,
} from '../certifications';
import { AssertAdmin } from '../users';
import { ValidateIds } from '../validate-ids.guard';
import { ZodValidator } from '../zod-validator';
import {
  AssertCertification,
  TargetCertification,
} from './assert-certificaiton.guard';

const CertificationIdParam = 'certificationId';

@Controller('api/admin/certifications')
@UseGuards(AssertAdmin)
export class AdminCertificationsController {
  constructor(
    @Inject(CertificationsService)
    private readonly certificationsService: CertificationsService,

    @Inject(AgenciesService)
    private readonly agenciesService: AgenciesService,
  ) {}

  /**
   * @openapi
   * /api/admin/certifications:
   *   get:
   *     summary: Search certifications
   *     operationId: adminSearchCertifications
   *     description: Search certifications
   *     tags:
   *       - Admin
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/CertificationQuery"
   *       - $ref: "#/components/parameters/CertificationAgency"
   *       - $ref: "#/components/parameters/QuerySkip"
   *       - $ref: "#/components/parameters/QueryLimit"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the list of certifications matching the search criteria.
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
   *                   description: The list of certifications matching the search criteria.
   *                   items:
   *                     $ref: "#/components/schemas/Certification"
   *                 totalCount:
   *                   type: integer
   *                   description: The total number of certifications matching the search criteria (not filtered out by pagination).
   *                   example: 18
   *       400:
   *         description: The request failed because the query string parameters were invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   */
  @Get()
  async searchCertifications(
    @Query(new ZodValidator(SearchCertificationsParamsSchema))
    options: SearchCertificationsParamsDTO,
  ): Promise<ApiList<CertificationDTO>> {
    const results = await this.certificationsService.searchCertifications(
      options,
    );
    return {
      data: results.data.map((cert) => cert.toJSON()),
      totalCount: results.totalCount,
    };
  }

  /**
   * @openapi
   * /api/admin/certifications/{certificationId}:
   *   get:
   *     summary: Get a certification
   *     operationId: adminGetCertification
   *     description: Get a certification
   *     tags:
   *       - Admin
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/CertificationId"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the requested certification.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Certification"
   *       400:
   *         description: The request failed because the certification ID was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       404:
   *         description: The request failed because the certification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   */
  @Get(`:${CertificationIdParam}`)
  @UseGuards(ValidateIds(CertificationIdParam), AssertCertification)
  getCertification(
    @TargetCertification() cert: Certification,
  ): CertificationDTO {
    this.agenciesService.getAgency;
    return cert.toJSON();
  }

  /**
   * @openapi
   * /api/admin/certifications:
   *   post:
   *     summary: Create a certification
   *     operationId: adminCreateCertification
   *     description: Create a certification
   *     tags:
   *       - Admin
   *       - Certifications
   *     requestBody:
   *       description: The certification to create.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateCertification"
   *     responses:
   *       201:
   *         description: The request succeeded and the response body will contain the created certification.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Certification"
   *       400:
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   */
  @Post()
  async createCertification(
    @Body(new ZodValidator(CreateOrUpdateCertificationParamsSchema))
    data: CreateOrUpdateCertificationParamsDTO,
  ): Promise<CertificationDTO> {
    const agency = await this.agenciesService.getAgency(data.agency);
    if (!agency) {
      throw new NotFoundException(`Agency with ID "${data.agency}" not found.`);
    }

    const cert = await this.certificationsService.createCertification({
      ...data,
      agency,
    });

    return cert.toJSON();
  }

  /**
   * @openapi
   * /api/admin/certifications/{certificationId}:
   *   put:
   *     summary: Update a certification
   *     operationId: adminUpdateCertification
   *     description: Update a certification
   *     tags:
   *       - Admin
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/CertificationId"
   *     requestBody:
   *       description: The certification to update.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/UpdateCertification"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the updated certification.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Certification"
   *       400:
   *         description: The request failed because the new certification data was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       404:
   *         description: The request failed because the certification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   */
  @Put(`:${CertificationIdParam}`)
  @UseGuards(ValidateIds(CertificationIdParam), AssertCertification)
  async updateCertification(
    @TargetCertification() cert: Certification,
    @Body(new ZodValidator(CreateOrUpdateCertificationParamsSchema))
    data: CreateOrUpdateCertificationParamsDTO,
  ): Promise<CertificationDTO> {
    const agency = await this.agenciesService.getAgency(data.agency);
    if (!agency) {
      throw new NotFoundException(`Agency with ID "${data.agency}" not found.`);
    }

    cert.agency = agency;
    cert.course = data.course;
    await cert.save();
    return cert.toJSON();
  }

  /**
   * @openapi
   * /api/admin/certifications/{certificationId}:
   *   delete:
   *     summary: Delete a certification
   *     operationId: adminDeleteCertification
   *     description: Delete a certification
   *     tags:
   *       - Admin
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/CertificationId"
   *     responses:
   *       204:
   *         description: The request succeeded and the certification was deleted.
   *       400:
   *         description: The request failed because the certification ID was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       404:
   *         description: The request failed because the certification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   */
  @Delete(`:${CertificationIdParam}`)
  @HttpCode(204)
  @UseGuards(ValidateIds(CertificationIdParam), AssertCertification)
  async deleteCertification(
    @TargetCertification() cert: Certification,
  ): Promise<void> {
    await cert.delete();
  }
}
