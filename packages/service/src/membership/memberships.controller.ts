import { ListMembershipsResponseDTO } from '@bottomtime/api';

import { Controller, Get } from '@nestjs/common';

import { MembershipService } from './membership.service';

@Controller('api/membership')
export class MembershipsController {
  constructor(private readonly service: MembershipService) {}

  @Get()
  async getMemberships(): Promise<ListMembershipsResponseDTO> {
    return await this.service.listMemberships();
  }
}
