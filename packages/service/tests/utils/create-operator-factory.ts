import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../src/data';
import { OperatorFactory } from '../../src/operators';
import { dataSource } from '../data-source';
import { createDiveSiteFactory } from './create-dive-site-factory';
import { createUserFactory } from './create-user-factory';

export function createOperatorFactory(
  emitter?: EventEmitter2,
): OperatorFactory {
  return new OperatorFactory(
    dataSource.getRepository(OperatorEntity),
    dataSource.getRepository(OperatorReviewEntity),
    dataSource.getRepository(OperatorTeamMemberEntity),
    dataSource.getRepository(OperatorDiveSiteEntity),
    dataSource.getRepository(UserEntity),
    createDiveSiteFactory(emitter),
    createUserFactory(),
  );
}
