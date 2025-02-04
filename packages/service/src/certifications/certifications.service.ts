import {
  ApiList,
  CreateOrUpdateCertificationParamsDTO,
  SearchCertificationsParamsDTO,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { AgencyEntity, CertificationEntity } from '../data';
import { Agency } from './agency';
import { Certification } from './certification';

export type SearchCertificationsOptions = SearchCertificationsParamsDTO;
export type CreateCertificationOptions = Omit<
  CreateOrUpdateCertificationParamsDTO,
  'agency'
> & { agency: Agency };

@Injectable()
export class CertificationsService {
  private readonly log = new Logger(CertificationsService.name);

  constructor(
    @InjectRepository(AgencyEntity)
    private readonly agencies: Repository<AgencyEntity>,

    @InjectRepository(CertificationEntity)
    private readonly certifications: Repository<CertificationEntity>,
  ) {}

  async searchCertifications(
    options: SearchCertificationsOptions,
  ): Promise<ApiList<Certification>> {
    let query = this.certifications
      .createQueryBuilder('certifications')
      .innerJoinAndMapOne(
        'certifications.agency',
        AgencyEntity,
        'agency',
        'certifications.agencyId = agency.id',
      )
      .select([
        'certifications.id',
        'certifications.course',
        'agency.id',
        'agency.name',
        'agency.longName',
        'agency.logo',
        'agency.website',
        'agency.ordinal',
      ])
      .orderBy('agency.ordinal', 'ASC', 'NULLS LAST')
      .addOrderBy('agency.name', 'ASC')
      .addOrderBy('certifications.course', 'ASC')
      .offset(options.skip)
      .limit(options.limit);

    if (options.agency) {
      query = query.andWhere(
        'agency.name ILIKE :agencyName OR agency.longName ILIKE :agencyName',
        {
          agencyName: `%${options.agency}%`,
        },
      );
    }

    this.log.verbose('Querying for certifications using query', query.getSql());
    const [results, totalCount] = await query.getManyAndCount();

    return {
      data: results.map(
        (result) =>
          new Certification(this.agencies, this.certifications, result),
      ),
      totalCount,
    };
  }

  async getCertification(id: string): Promise<Certification | undefined> {
    const cert = await this.certifications.findOne({
      where: { id },
      relations: ['agency'],
    });
    return cert
      ? new Certification(this.agencies, this.certifications, cert)
      : undefined;
  }

  async createCertification(
    options: CreateCertificationOptions,
  ): Promise<Certification> {
    const data = new CertificationEntity();
    data.id = uuid();
    data.course = options.course;
    data.agency = options.agency.toEntity();

    await this.certifications.save(data);

    return new Certification(this.agencies, this.certifications, data);
  }
}
