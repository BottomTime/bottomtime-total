import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../data';
import { DiveSiteFactory } from '../diveSites';
import { UserFactory } from '../users';
import { Operator } from './operator';

@Injectable()
export class OperatorFactory {
  constructor(
    @InjectRepository(OperatorEntity)
    private readonly operators: Repository<OperatorEntity>,

    @InjectRepository(OperatorReviewEntity)
    private readonly reviews: Repository<OperatorReviewEntity>,

    @InjectRepository(OperatorTeamMemberEntity)
    private readonly members: Repository<OperatorTeamMemberEntity>,

    @InjectRepository(OperatorDiveSiteEntity)
    private readonly operatorDiveSites: Repository<OperatorDiveSiteEntity>,

    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,

    @Inject(DiveSiteFactory)
    private readonly siteFactory: DiveSiteFactory,

    @Inject(UserFactory)
    private readonly userFactory: UserFactory,
  ) {}

  createOperator(data: OperatorEntity): Operator {
    return new Operator(
      this.operators,
      this.operatorDiveSites,
      this.reviews,
      this.members,
      this.users,
      this.siteFactory,
      this.userFactory,
      data,
    );
  }
}
