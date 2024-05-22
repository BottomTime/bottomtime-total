import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DiveSiteEntity, DiveSiteReviewEntity, UserEntity } from '../data';
import { DiveSite } from './dive-site';

@Injectable()
export class DiveSiteFactory {
  constructor(
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,

    @InjectRepository(DiveSiteEntity)
    private readonly DiveSites: Repository<DiveSiteEntity>,

    @InjectRepository(DiveSiteReviewEntity)
    private readonly Reviews: Repository<DiveSiteReviewEntity>,

    @Inject(EventEmitter2)
    private readonly emitter: EventEmitter2,
  ) {}

  createDiveSite(data: DiveSiteEntity): DiveSite {
    return new DiveSite(
      this.Users,
      this.DiveSites,
      this.Reviews,
      this.emitter,
      data,
    );
  }
}
