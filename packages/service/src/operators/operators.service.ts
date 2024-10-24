import {
  CreateOrUpdateOperatorDTO,
  SearchOperatorsParams,
} from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import slugify from 'slugify';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { OperatorEntity } from '../data';
import { User } from '../users';
import { Operator } from './operator';
import { OperatorQueryBuilder } from './operator-query-builder';

export type CreateOperatorOptions = CreateOrUpdateOperatorDTO & {
  owner: User;
};

export type SearchOperatorOptions = Omit<SearchOperatorsParams, 'owner'> & {
  owner?: User;
};

@Injectable()
export class OperatorsService {
  constructor(
    @InjectRepository(OperatorEntity)
    private readonly operators: Repository<OperatorEntity>,
  ) {}

  async createOperator(options: CreateOperatorOptions): Promise<Operator> {
    const data = new OperatorEntity();
    data.id = uuid();
    data.name = options.name;
    data.owner = options.owner.toEntity();

    const operator = new Operator(this.operators, data);
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

  async getOperator(id: string): Promise<Operator | undefined> {
    const data = await this.operators.findOne({
      where: { id },
      relations: ['owner'],
    });
    return data ? new Operator(this.operators, data) : undefined;
  }

  async getOperatorBySlug(slug: string): Promise<Operator | undefined> {
    const data = await this.operators.findOne({
      where: { slug: slug.toLowerCase() },
      relations: ['owner'],
    });
    return data ? new Operator(this.operators, data) : undefined;
  }

  async isSlugInUse(slug: string): Promise<boolean> {
    return await this.operators.existsBy({ slug: slug.trim().toLowerCase() });
  }

  async searchOperators(options?: SearchOperatorOptions): Promise<{
    operators: Operator[];
    totalCount: number;
  }> {
    const query = new OperatorQueryBuilder(this.operators)
      .withGeoLocation(options?.location, options?.radius)
      .withInactive(options?.showInactive)
      .withOwner(options?.owner)
      .withPagination(options?.skip, options?.limit)
      .withTextSearch(options?.query)
      .withVerificationStatus(options?.verification)
      .build();
    const [operators, totalCount] = await query.getManyAndCount();

    return {
      operators: operators.map(
        (operator) => new Operator(this.operators, operator),
      ),
      totalCount,
    };
  }
}
