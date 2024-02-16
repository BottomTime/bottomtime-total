import {
  CertificationDTO,
  CreateOrUpdateCertificationParamsDTO,
  CreateOrUpdateCertificationParamsSchema,
  SearchCertificationsParamsDTO,
  SearchCertificationsParamsSchema,
  SearchCertificationsResponseDTO,
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

import { AssertAdmin } from '../auth';
import { Certification, CertificationsService } from '../certifications';
import { ZodValidator } from '../zod-validator';
import { TargetCertification } from './admin.decorators';
import { AssertCertification } from './assert-certificaiton.guard';

const CertificationIdParam = 'certificationId';

@Controller('api/admin/certifications')
@UseGuards(AssertAdmin)
export class AdminCertificationsController {
  constructor(
    @Inject(CertificationsService)
    private readonly certificationsService: CertificationsService,
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
   *                 - certifications
   *                 - totalCount
   *               properties:
   *                 certifications:
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
  ): Promise<SearchCertificationsResponseDTO> {
    const results = await this.certificationsService.searchCertifications(
      options,
    );
    return {
      certifications: results.certifications.map((cert) => cert.toJSON()),
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
  @UseGuards(AssertCertification)
  getCertification(
    @TargetCertification() cert: Certification,
  ): CertificationDTO {
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
    const cert = await this.certificationsService.createCertification(data);
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
  @UseGuards(AssertCertification)
  async updateCertification(
    @TargetCertification() cert: Certification,
    @Body(new ZodValidator(CreateOrUpdateCertificationParamsSchema))
    data: CreateOrUpdateCertificationParamsDTO,
  ): Promise<CertificationDTO> {
    cert.agency = data.agency;
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
  @UseGuards(AssertCertification)
  async deleteCertification(
    @TargetCertification() cert: Certification,
  ): Promise<void> {
    await cert.delete();
  }
}
