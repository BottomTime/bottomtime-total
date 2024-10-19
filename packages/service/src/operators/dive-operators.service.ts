import {
  CreateOrUpdateDiveOperatorDTO,
  SearchDiveOperatorsParams,
} from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import slugify from 'slugify';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { DiveOperatorEntity } from '../data';
import { User } from '../users';
import { DiveOperator } from './dive-operator';
import { DiveOperatorQueryBuilder } from './dive-operator-query-builder';

export type CreateDiveOperatorOptions = CreateOrUpdateDiveOperatorDTO & {
  owner: User;
};

export type SearchDiveOperatorOptions = Omit<
  SearchDiveOperatorsParams,
  'owner'
> & {
  owner?: User;
};

@Injectable()
export class DiveOperatorsService {
  constructor(
    @InjectRepository(DiveOperatorEntity)
    private readonly operators: Repository<DiveOperatorEntity>,
  ) {}

  async createOperator(
    options: CreateDiveOperatorOptions,
  ): Promise<DiveOperator> {
    const data = new DiveOperatorEntity();
    data.id = uuid();
    data.name = options.name;
    data.owner = options.owner.toEntity();

    const operator = new DiveOperator(this.operators, data);
    operator.address = options.address;
    operator.description = options.description;
    operator.email = options.email;
    operator.gps = options.gps;
    operator.name = options.name;
    operator.phone = options.phone;
    operator.socials.facebook = options.socials?.facebook;
    operator.socials.instagram = options.socials?.instagram;
    operator.socials.tiktok = options.socials?.tiktok;
    operator.socials.twitter = options.socials?.twitter;
    operator.socials.youtube = options.socials?.youtube;
    operator.website = options.website;

    operator.slug =
      options.slug || slugify(options.name, { lower: true, trim: true });

    await operator.save();

    return operator;
  }

  async getOperator(id: string): Promise<DiveOperator | undefined> {
    const data = await this.operators.findOne({
      where: { id },
      relations: ['owner'],
    });
    return data ? new DiveOperator(this.operators, data) : undefined;
  }

  async getOperatorBySlug(slug: string): Promise<DiveOperator | undefined> {
    const data = await this.operators.findOne({
      where: { slug: slug.toLowerCase() },
      relations: ['owner'],
    });
    return data ? new DiveOperator(this.operators, data) : undefined;
  }

  async isSlugInUse(slug: string): Promise<boolean> {
    return await this.operators.existsBy({ slug: slug.trim().toLowerCase() });
  }

  async searchOperators(options?: SearchDiveOperatorOptions): Promise<{
    operators: DiveOperator[];
    totalCount: number;
  }> {
    const query = new DiveOperatorQueryBuilder(this.operators)
      .withGeoLocation(options?.location, options?.radius)
      .withOwner(options?.owner)
      .withPagination(options?.skip, options?.limit)
      .withTextSearch(options?.query)
      .build();
    const [operators, totalCount] = await query.getManyAndCount();

    return {
      operators: operators.map(
        (operator) => new DiveOperator(this.operators, operator),
      ),
      totalCount,
    };
  }
}
