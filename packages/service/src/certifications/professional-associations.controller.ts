import {
  ApiList,
  CreateOrUpdateProfessionalAssociationParamsDTO,
  CreateOrUpdateProfessionalAssociationParamsSchema,
  ProfessionalAssociationDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
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

import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
  User,
} from '../users';
import { bodyValidator } from '../zod-validator';
import { AgenciesService } from './agencies.service';
import {
  AssertTargetAssociation,
  TargetAssociation,
} from './assert-target-association';
import { ProfessionalAssociation } from './professional-association';
import { ProfessionalAssociationsService } from './professional-associations.service';

const AssociationIdKey = 'associationId';
const AssociationIdParam = `:${AssociationIdKey}`;

@Controller('api/users/:username/professionalAssociations')
@UseGuards(AssertTargetUser)
export class ProfessionalAssociationsController {
  constructor(
    @Inject(AgenciesService)
    private readonly agencies: AgenciesService,

    @Inject(ProfessionalAssociationsService)
    private readonly service: ProfessionalAssociationsService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/professionalAssociations:
   *   get:
   *     summary: List professional associations for a user
   *     operationId: listAssociations
   *     description: Retrieve a list of professional associations for the specified user.
   *     tags:
   *       - Certifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
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
   *                   title: ProfessionalAssociations
   *                   description: An array of professional associations.
   *                   items:
   *                     $ref: "#/components/schemas/ProfessionalAssociation"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   description: The total number of professional associations matching the search criteria.
   *                   example: 5
   *       "404":
   *         description: The request failed because the indicated user does not exist.
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
  @Get()
  async listAssociations(
    @TargetUser() user: User,
  ): Promise<ApiList<ProfessionalAssociationDTO>> {
    const { data, totalCount } = await this.service.listAssociations(user);
    return {
      data: data.map((association) => association.toJSON()),
      totalCount,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/professionalAssociations:
   *   post:
   *     summary: Create a professional association
   *     operationId: createAssociation
   *     description: Allows a user (or an administrator) to create a new professional association.
   *     tags:
   *       - Certifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - agency
   *               - identificationNumber
   *               - title
   *             properties:
   *               agency:
   *                 type: string
   *                 title: Agency ID
   *                 format: uuid
   *                 description: The affiliated agency's unique ID.
   *                 example: 57ac305a-beb1-4fcd-a96c-bb16ed5687cd
   *               identificationNumber:
   *                 type: string
   *                 title: Identification Number
   *                 description: The identification number or membership ID. (E.g. PADI Pro number)
   *                 example: 123456
   *                 maxLength: 100
   *               title:
   *                 type: string
   *                 title: Title
   *                 description: The title of the professional association.
   *                 example: Master Scuba Diver Trainer
   *                 maxLength: 200
   *               startDate:
   *                 type: string
   *                 title: Start Date
   *                 format: date
   *                 description: The start date of the professional association.
   *                 example: 2021-01-01
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body contains the newly created professional association.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ProfessionalAssociation"
   *       "400":
   *         description: |
   *           The request failed because the request body was missing or invalid, or the agency with the
   *           specified ID does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because it was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the authenticated user is not authorized to create the professional association.
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
  @UseGuards(AssertAuth, AssertAccountOwner)
  async createAssociation(
    @TargetUser() user: User,
    @Body(bodyValidator(CreateOrUpdateProfessionalAssociationParamsSchema))
    options: CreateOrUpdateProfessionalAssociationParamsDTO,
  ): Promise<ProfessionalAssociationDTO> {
    const agency = await this.agencies.getAgency(options.agency);
    if (!agency) {
      throw new BadRequestException(
        `Agency with ID "${options.agency}" does not exist.`,
      );
    }

    const association = await this.service.createAssociation({
      ...options,
      user,
      agency,
    });
    return association.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/professionalAssociations/{associationId}:
   *   get:
   *     summary: Get a professional association
   *     operationId: getAssociation
   *     description: Retrieve a single professional association by its ID.
   *     tags:
   *       - Certifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/ProfessionalAssociationId"
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body contains the professional association.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ProfessionalAssociation"
   *       "404":
   *         description: The request failed because the professional association with the specified ID was not found.
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
  @Get(AssociationIdParam)
  @UseGuards(AssertTargetAssociation)
  getAssociation(
    @TargetAssociation() association: ProfessionalAssociation,
  ): ProfessionalAssociationDTO {
    return association.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/professionalAssociations/{associationId}:
   *   put:
   *     summary: Update a professional association
   *     operationId: updateAssociation
   *     description: Allows a user (or an administrator) to update one of their professional associations by its ID.
   *     tags:
   *       - Certifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/ProfessionalAssociationId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - agency
   *               - identificationNumber
   *               - title
   *             properties:
   *               agency:
   *                 type: string
   *                 title: Agency ID
   *                 format: uuid
   *                 description: The affiliated agency's unique ID.
   *                 example: 57ac305a-beb1-4fcd-a96c-bb16ed5687cd
   *               identificationNumber:
   *                 type: string
   *                 title: Identification Number
   *                 description: The identification number or membership ID. (E.g. PADI Pro number)
   *                 example: 123456
   *                 maxLength: 100
   *               title:
   *                 type: string
   *                 title: Title
   *                 description: The title of the professional association.
   *                 example: Master Scuba Diver Trainer
   *                 maxLength: 200
   *               startDate:
   *                 type: string
   *                 title: Start Date
   *                 format: date
   *                 description: The start date of the professional association.
   *                 example: 2021-01-01
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body contains the updated professional association.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ProfessionalAssociation"
   *       "400":
   *         description: |
   *           The request failed because the request body was missing or invalid, or the agency with the
   *           specified ID does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because it was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the authenticated user is not authorized to update the professional association.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the professional association with the specified ID was not found, or it does not belong
   *           to the indicated user.
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
  @Put(AssociationIdParam)
  @UseGuards(AssertAuth, AssertAccountOwner, AssertTargetAssociation)
  async updateAssociation(
    @TargetAssociation() association: ProfessionalAssociation,
    @Body(bodyValidator(CreateOrUpdateProfessionalAssociationParamsSchema))
    options: CreateOrUpdateProfessionalAssociationParamsDTO,
  ): Promise<ProfessionalAssociationDTO> {
    const agency = await this.agencies.getAgency(options.agency);
    if (!agency) {
      throw new BadRequestException(
        `Agency with ID "${options.agency}" does not exist.`,
      );
    }

    association.identificationNumber = options.identificationNumber;
    association.startDate = options.startDate;
    association.title = options.title;
    association.agency = agency;
    await association.save();

    return association.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/professionalAssociations/{associationId}:
   *   delete:
   *     summary: Delete a professional association
   *     operationId: deleteAssociation
   *     description: Allows a user (or an administrator) to delete one of their professional association by its ID.
   *     tags:
   *       - Certifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/ProfessionalAssociationId"
   *     responses:
   *       "204":
   *         description: The request succeeded and the professional association was deleted.
   *       "401":
   *         description: The request failed because it was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the authenticated user is not authorized to delete the professional association.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the professional association with the specified ID was not found.
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
  @Delete(AssociationIdParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertAuth, AssertAccountOwner, AssertTargetAssociation)
  async deleteAssociation(
    @TargetAssociation() association: ProfessionalAssociation,
  ): Promise<void> {
    await association.delete();
  }
}
