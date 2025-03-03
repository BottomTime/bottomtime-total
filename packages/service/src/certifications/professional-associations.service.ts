import {
  ApiList,
  CreateOrUpdateProfessionalAssociationParamsDTO,
} from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { AgencyEntity, UserProfessionalAssociationsEntity } from '../data';
import { User } from '../users';
import { Agency } from './agency';
import { ProfessionalAssociation } from './professional-association';

export type CreateAssociationOptions = Omit<
  CreateOrUpdateProfessionalAssociationParamsDTO,
  'agency'
> & {
  agency: Agency;
  user: User;
};

@Injectable()
export class ProfessionalAssociationsService {
  constructor(
    @InjectRepository(UserProfessionalAssociationsEntity)
    private readonly associations: Repository<UserProfessionalAssociationsEntity>,

    @InjectRepository(AgencyEntity)
    private readonly agencies: Repository<AgencyEntity>,
  ) {}

  async listAssociations(
    user: User,
  ): Promise<ApiList<ProfessionalAssociation>> {
    const [results, totalCount] = await this.associations.findAndCount({
      where: { user: { id: user.id } },
      relations: ['agency'],
      order: {},
    });
    return {
      data: results.map(
        (result) =>
          new ProfessionalAssociation(this.agencies, this.associations, result),
      ),
      totalCount,
    };
  }

  async getAssociation(
    user: User,
    id: string,
  ): Promise<ProfessionalAssociation | undefined> {
    const data = await this.associations.findOne({
      where: { id, user: { id: user.id } },
      relations: ['agency'],
    });

    if (data) {
      return new ProfessionalAssociation(this.agencies, this.associations, {
        ...data,
        user: user.toEntity(),
      });
    }

    return undefined;
  }

  async createAssociation(
    options: CreateAssociationOptions,
  ): Promise<ProfessionalAssociation> {
    const association = new ProfessionalAssociation(
      this.agencies,
      this.associations,
      {
        id: uuid(),
        identificationNumber: options.identificationNumber,
        startDate: options.startDate ?? null,
        title: options.title,
        user: options.user.toEntity(),
        agency: options.agency.toEntity(),
      },
    );
    await association.save();
    return association;
  }
}
