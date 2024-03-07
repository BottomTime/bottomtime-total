import {
  CreateOrUpdateCertificationParamsDTO,
  SearchCertificationsParamsDTO,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { CertificationEntity } from '../data';
import { Certification } from './certification';

export type SearchCertificationsOptions = SearchCertificationsParamsDTO;
export type SearchCertificationsResults = {
  certifications: Certification[];
  totalCount: number;
};
export type CreateCertificationOptions = CreateOrUpdateCertificationParamsDTO;

@Injectable()
export class CertificationsService {
  private readonly log = new Logger(CertificationsService.name);

  constructor(
    @InjectRepository(CertificationEntity)
    private readonly certifications: Repository<CertificationEntity>,
  ) {}

  async searchCertifications(
    options: SearchCertificationsOptions,
  ): Promise<SearchCertificationsResults> {
    let query = this.certifications.createQueryBuilder('certifications');

    if (options.agency) {
      query = query.andWhere({ agency: options.agency });
    }

    query = query
      .orderBy('agency', 'ASC')
      .orderBy('course', 'ASC')
      .offset(options.skip)
      .take(options.limit);

    // TODO:
    // if (options.query) {
    //   query.$text = {
    //     $search: options.query,
    //     $language: 'en',
    //     $caseSensitive: false,
    //     $diacriticSensitive: false,
    //   };
    // }

    this.log.verbose('Querying for certifications using query', query.getSql());
    const [results, totalCount] = await query.getManyAndCount();

    return {
      certifications: results.map(
        (result) => new Certification(this.certifications, result),
      ),
      totalCount,
    };
  }

  async getCertification(id: string): Promise<Certification | undefined> {
    const cert = await this.certifications.findOneBy({ id });
    return cert ? new Certification(this.certifications, cert) : undefined;
  }

  async createCertification(
    options: CreateCertificationOptions,
  ): Promise<Certification> {
    const data = new CertificationEntity();
    data.id = uuid();
    data.course = options.course;
    data.agency = options.agency;

    await this.certifications.save(data);

    return new Certification(this.certifications, data);
  }
}
