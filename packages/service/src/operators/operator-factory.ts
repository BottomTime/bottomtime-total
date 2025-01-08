import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
} from '../data';
import { DiveSiteFactory } from '../diveSites';
import { Operator } from './operator';

@Injectable()
export class OperatorFactory {
  constructor(
    @InjectRepository(OperatorEntity)
    private readonly operators: Repository<OperatorEntity>,

    @InjectRepository(OperatorReviewEntity)
    private readonly reviews: Repository<OperatorReviewEntity>,

    @InjectRepository(OperatorDiveSiteEntity)
    private readonly operatorDiveSites: Repository<OperatorDiveSiteEntity>,

    @Inject(DiveSiteFactory)
    private readonly siteFactory: DiveSiteFactory,
  ) {}

  createOperator(data: OperatorEntity): Operator {
    return new Operator(
      this.operators,
      this.operatorDiveSites,
      this.reviews,
      this.siteFactory,
      data,
    );
  }
}
