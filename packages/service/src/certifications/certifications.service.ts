import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Collections } from '../data';
import { FilterQuery, Model } from 'mongoose';
import { CertificationData } from '../schemas/certifications.document';
import {
  CreateOrUpdateCertificationParamsDTO,
  SearchCertificationsParamsDTO,
} from '@bottomtime/api';
import { Certification } from './certification';
import { v4 as uuid } from 'uuid';

export type SearchCertificationsOptions = SearchCertificationsParamsDTO;
export type CreateCertificationOptions = CreateOrUpdateCertificationParamsDTO;

@Injectable()
export class CertificationsService {
  constructor(
    @InjectModel(Collections.KnownCertifications)
    private readonly certifications: Model<CertificationData>,
  ) {}

  async searchCertifications(
    options: SearchCertificationsOptions,
  ): Promise<Certification[]> {
    const query: FilterQuery<CertificationData> = {};

    if (options.agency) {
      query.agency = options.agency;
    }

    if (options.query) {
      query.$text = {
        $search: options.query,
        $language: 'en',
        $caseSensitive: false,
        $diacriticSensitive: false,
      };
    }

    const results = await this.certifications.find(query);
    return results.map((result) => new Certification(result));
  }

  async getCertification(id: string): Promise<Certification | undefined> {
    const cert = await this.certifications.findById(id);
    return cert ? new Certification(cert) : undefined;
  }

  async createCertification(
    options: CreateCertificationOptions,
  ): Promise<Certification> {
    const data = new this.certifications({
      _id: uuid(),
      ...options,
    });

    const cert = new Certification(data);
    await cert.save();

    return cert;
  }
}
