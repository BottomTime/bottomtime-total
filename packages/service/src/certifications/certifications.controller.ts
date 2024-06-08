import {
  CertificationDTO,
  SearchCertificationsParamsDTO,
  SearchCertificationsParamsSchema,
  SearchCertificationsResponseDTO,
} from '@bottomtime/api';

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth } from '../auth';
import { ValidateIds } from '../validate-ids.guard';
import { ZodValidator } from '../zod-validator';
import { CertificationsService } from './certifications.service';

const CertificationIdParam = 'certificationId';

@Controller('api/certifications')
@UseGuards(AssertAuth)
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  /**
   * @openapi
   * /api/certifications:
   *   get:
   *     summary: Search certifications
   *     operationId: searchCertifications
   *     tags:
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/CertificationQuery"
   *       - $ref: "#/components/parameters/CertificationAgency"
   *       - $ref: "#/components/parameters/QuerySkip"
   *       - $ref: "#/components/parameters/QueryLimit"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the list of certifications matching the search criteria.
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
   *                   description: The total number of certifications matching the search criteria.
   *                   example: 18
   *       400:
   *         description: The request failed because the query string parameters were invalid.
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
   * /api/certifications/{certificationId}:
   *   get:
   *     summary: Get a certification
   *     operationId: getCertification
   *     tags:
   *       - Certifications
   *     parameters:
   *       - $ref: "#/components/parameters/CertificationId"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the requested certification.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Certification"
   *       404:
   *         description: The request failed because the requested certification was not found.
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
  @Get(`:${CertificationIdParam}`)
  @UseGuards(ValidateIds(CertificationIdParam))
  async getCertification(
    @Param(CertificationIdParam) certId: string,
  ): Promise<CertificationDTO> {
    const cert = await this.certificationsService.getCertification(certId);

    if (!cert) {
      throw new NotFoundException(
        `Unable to find certification with ID "${certId}".`,
      );
    }

    return cert.toJSON();
  }
}
