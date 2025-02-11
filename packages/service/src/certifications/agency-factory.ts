import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AgencyEntity } from '../data';
import { Agency } from './agency';

@Injectable()
export class AgencyFactory {
  constructor(
    @InjectRepository(AgencyEntity)
    private readonly agencies: Repository<AgencyEntity>,
  ) {}

  createAgency(data: AgencyEntity): Agency {
    return new Agency(this.agencies, data);
  }
}
