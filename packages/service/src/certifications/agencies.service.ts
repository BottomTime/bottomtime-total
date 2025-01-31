import { ApiList } from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AgencyEntity } from '../data';
import { Agency } from './agency';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(AgencyEntity)
    private readonly agencies: Repository<AgencyEntity>,
  ) {}

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
}
