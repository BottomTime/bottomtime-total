import { ApiList, CreateOrUpdateAgencyDTO } from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { AgencyEntity } from '../data';
import { Agency } from './agency';
import { AgencyFactory } from './agency-factory';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(AgencyEntity)
    private readonly agencies: Repository<AgencyEntity>,

    @Inject(AgencyFactory) private readonly agencyFactory: AgencyFactory,
  ) {}

  private async getNextAvailableOrdinal(): Promise<number> {
    const max = await this.agencies.maximum('ordinal' as never);
    return (max ?? 0) + 1;
  }

  async listAgencies(): Promise<ApiList<Agency>> {
    const [data, totalCount] = await this.agencies.findAndCount({
      order: { ordinal: { direction: 'ASC', nulls: 'last' }, name: 'ASC' },
    });
    return {
      data: data.map((agency) => new Agency(this.agencies, agency)),
      totalCount,
    };
  }

  async getAgency(id: string): Promise<Agency | undefined> {
    const data = await this.agencies.findOneBy({ id });
    return data ? new Agency(this.agencies, data) : undefined;
  }

  async createAgency(options: CreateOrUpdateAgencyDTO): Promise<Agency> {
    const data: AgencyEntity = {
      id: uuid(),
      ordinal: await this.getNextAvailableOrdinal(),
      name: options.name,
      longName: options.longName ?? null,
      logo: options.logo,
      website: options.website,
    };

    const agency = this.agencyFactory.createAgency(data);
    await agency.save();

    return agency;
  }
}
