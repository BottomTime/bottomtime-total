import { ApiList, ListOperatorDiveSitesParams } from '@bottomtime/api';

import { Logger } from '@nestjs/common';

import { In, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  DiveSiteEntity,
  OperatorDiveSiteEntity,
  OperatorEntity,
  UserEntity,
} from '../data';
import { DiveSite, DiveSiteFactory } from '../diveSites';

export class OperatorSites {
  private readonly log = new Logger(OperatorSites.name);

  constructor(
    private readonly operators: Repository<OperatorEntity>,
    private readonly operatorDiveSites: Repository<OperatorDiveSiteEntity>,
    private readonly siteFactory: DiveSiteFactory,
    private readonly entity: OperatorEntity,
  ) {}

  async listSites(
    options?: ListOperatorDiveSitesParams,
  ): Promise<ApiList<DiveSite>> {
    const query = this.operators.manager
      .getRepository(DiveSiteEntity)
      .createQueryBuilder('sites')
      .innerJoin('sites.operators', 'operators')
      .innerJoinAndMapOne(
        'sites.creator',
        UserEntity,
        'creators',
        'creators.id = sites.creatorId',
      )
      .where('operators.operatorId = :operatorId', {
        operatorId: this.entity.id,
      })
      .orderBy('sites.name', 'ASC')
      .skip(options?.skip ?? 0)
      .take(options?.limit ?? 50);

    this.log.debug(
      `Querying for dive sites associated with operator "${this.entity.name}" (${this.entity.id})...`,
    );
    this.log.verbose(query.getSql());
    const [data, totalCount] = await query.getManyAndCount();

    return {
      data: data.map((site) => this.siteFactory.createDiveSite(site)),
      totalCount,
    };
  }

  async addSites(sitesToAdd: DiveSite[]): Promise<number> {
    const sites = sitesToAdd.reduce<Record<string, DiveSiteEntity>>(
      (acc, site) => {
        acc[site.id] = site.toEntity();
        return acc;
      },
      {},
    );

    const existingRelations: { siteId: string }[] = await this.operatorDiveSites
      .createQueryBuilder('relations')
      .where('relations.operatorId = :operatorId', {
        operatorId: this.entity.id,
        siteId: In(Object.keys(sites)),
      })
      .select('relations.siteId')
      .execute();
    existingRelations.forEach((relation) => {
      delete sites[relation.siteId];
    });

    this.log.debug(
      `Binding ${sites.length} dive sites to operator "${this.entity.name}" (${this.entity.id})...`,
    );
    const { identifiers } = await this.operatorDiveSites.insert(
      Object.values(sites).map((site) => ({
        id: uuid(),
        operator: { id: this.entity.id } as OperatorEntity,
        site: { id: site.id } as DiveSiteEntity,
      })) as any /* eslint-disable-line @typescript-eslint/no-explicit-any */,
    );
    return identifiers.length;
  }

  async removeSites(sitesToRemove: string[]): Promise<number> {
    const { affected } = await this.operatorDiveSites.delete({
      operator: { id: this.entity.id },
      site: { id: In(sitesToRemove) },
    });
    return affected ?? 0;
  }
}
