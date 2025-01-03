import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OperatorEntity, OperatorReviewEntity } from '../data';
import { Operator } from './operator';

@Injectable()
export class OperatorFactory {
  constructor(
    @InjectRepository(OperatorEntity)
    private readonly operators: Repository<OperatorEntity>,

    @InjectRepository(OperatorReviewEntity)
    private readonly reviews: Repository<OperatorReviewEntity>,
  ) {}

  createOperator(data: OperatorEntity): Operator {
    return new Operator(this.operators, this.reviews, data);
  }
}
