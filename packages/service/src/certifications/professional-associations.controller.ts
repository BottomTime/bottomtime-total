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

  @Get(AssociationIdParam)
  @UseGuards(AssertTargetAssociation)
  getAssociation(
    @TargetAssociation() association: ProfessionalAssociation,
  ): ProfessionalAssociationDTO {
    return association.toJSON();
  }

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

  @Delete(AssociationIdParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertAuth, AssertAccountOwner, AssertTargetAssociation)
  async deleteAssociation(
    @TargetAssociation() association: ProfessionalAssociation,
  ): Promise<void> {
    await association.delete();
  }
}
