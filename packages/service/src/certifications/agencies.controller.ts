import { AgencyDTO, ApiList } from '@bottomtime/api';

import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';

import { z } from 'zod';

import { ZodParamValidator } from '../zod-validator';
import { AgenciesService } from './agencies.service';

@Controller('api/agencies')
export class AgenciesController {
  constructor(
    @Inject(AgenciesService) private readonly service: AgenciesService,
  ) {}

  @Get()
  async listAgencies(): Promise<ApiList<AgencyDTO>> {
    const { data, totalCount } = await this.service.listAgencies();
    return { data: data.map((agency) => agency.toJSON()), totalCount };
  }

  @Get(':agencyId')
  async getAgency(
    @Param('agencyId', new ZodParamValidator(z.string().uuid())) id: string,
  ): Promise<AgencyDTO> {
    const agency = await this.service.getAgency(id);

    if (!agency) {
      throw new NotFoundException(`Agency with ID "${id}" not found.`);
    }

    return agency.toJSON();
  }
}
