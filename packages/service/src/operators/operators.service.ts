import {
  ApiList,
  CreateOrUpdateOperatorDTO,
  SearchOperatorsParams,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import slugify from 'slugify';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { OperatorEntity } from '../data';
import { User } from '../users';
import { Operator } from './operator';
import { OperatorFactory } from './operator-factory';
import { OperatorQueryBuilder } from './operator-query-builder';

export type CreateOperatorOptions = CreateOrUpdateOperatorDTO & {
  owner: User;
};

export type SearchOperatorOptions = Omit<SearchOperatorsParams, 'owner'> & {
  owner?: User;
};

@Injectable()
export class OperatorsService {
  private readonly log = new Logger(OperatorsService.name);

  constructor(
    @InjectRepository(OperatorEntity)
    private readonly operators: Repository<OperatorEntity>,

    @Inject(OperatorFactory)
    private readonly operatorFactory: OperatorFactory,
  ) {}

  async createOperator(options: CreateOperatorOptions): Promise<Operator> {
    this.log.debug(
      'Attempting to create new dive operator with options:',
      options,
    );
    const data = new OperatorEntity();
    data.id = uuid();
    data.name = options.name;
    data.owner = options.owner.toEntity();

    const operator = this.operatorFactory.createOperator(data);
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
    this.log.log(
      `Created new dive operator: "${operator.name}" (${operator.id})`,
    );

    return operator;
  }

  async getOperator(id: string): Promise<Operator | undefined> {
    this.log.debug(`Attempting to retrieve operator with ID: "${id}"`);
    const data = await this.operators.findOne({
      where: { id },
      relations: ['owner'],
    });
    return data ? this.operatorFactory.createOperator(data) : undefined;
  }

  async getOperatorBySlug(slug: string): Promise<Operator | undefined> {
    this.log.debug(`Attempting to retrieve operator with slug: "${slug}"`);
    slug = slug.trim().toLowerCase();
    const data = await this.operators.findOne({
      where: { slug },
      relations: ['owner'],
    });
    return data ? this.operatorFactory.createOperator(data) : undefined;
  }

  async isSlugInUse(slug: string): Promise<boolean> {
    this.log.debug(`Checking for existence of operator with slug: "${slug}"`);
    slug = slug.trim().toLowerCase();
    return await this.operators.exists({ where: { slug }, withDeleted: true });
  }

  async searchOperators(
    options?: SearchOperatorOptions,
  ): Promise<ApiList<Operator>> {
    this.log.debug('Performing search for dive operators:', options);
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
      data: operators.map((item) => this.operatorFactory.createOperator(item)),
      totalCount,
    };
  }
}
