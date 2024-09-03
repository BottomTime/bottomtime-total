import { ListMembershipsResponseDTO } from '@bottomtime/api';

import { Controller, Get } from '@nestjs/common';

import { MembershipService } from './membership.service';

@Controller('api/membership')
export class MembershipsController {
  constructor(private readonly service: MembershipService) {}

  /**
   * @openapi
   * /api/membership:
   *   get:
   *     tags:
   *       - Memberships
   *     operationId: listMemberships
   *     summary: List all memberships
   *     description: |
   *       Returns a list of all available memberships along with their prices and features.
   *     responses:
   *       "200":
   *         description: The request succeeded and the list of memberships will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Membership"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async getMemberships(): Promise<ListMembershipsResponseDTO> {
    return await this.service.listMemberships();
  }
}
