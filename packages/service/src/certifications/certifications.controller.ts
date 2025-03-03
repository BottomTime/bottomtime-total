import {
  ApiList,
  CertificationDTO,
  SearchCertificationsParamsDTO,
  SearchCertificationsParamsSchema,
} from '@bottomtime/api';

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth } from '../users';
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
   *       - name: agency
   *         in: query
   *         title: Agency
   *         description: |
   *           The name (or partial long name) of the agency that offers the certifications to search for.
   *           Results will be filtered to only include courses offered by this agency.
   *         schema:
   *           type: string
   *           example: ssi
   *       - name: skip
   *         in: query
   *         title: Skip
   *         description: The number of certifications to skip over before returning results.
   *         schema:
   *           type: integer
   *           format: int32
   *           minimum: 0
   *           default: 0
   *           example: 0
   *       - name: limit
   *         in: query
   *         title: Limit
   *         description: The maximum number of certifications to return.
   *         schema:
   *           type: integer
   *           format: int32
   *           minimum: 1
   *           maximum: 400
   *           default: 100
   *           example: 100
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the list of certifications matching the search criteria.
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
