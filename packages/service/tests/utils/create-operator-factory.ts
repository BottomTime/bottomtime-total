import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../src/data';
import { OperatorFactory } from '../../src/operators';
import { UserFactory } from '../../src/users';
import { dataSource } from '../data-source';
import { createDiveSiteFactory } from './create-dive-site-factory';

export function createOperatorFactory(
  emitter?: EventEmitter2,
): OperatorFactory {
  const users = dataSource.getRepository(UserEntity);
  return new OperatorFactory(
    dataSource.getRepository(OperatorEntity),
    dataSource.getRepository(OperatorReviewEntity),
    dataSource.getRepository(OperatorTeamMemberEntity),
    dataSource.getRepository(OperatorDiveSiteEntity),
    users,
    createDiveSiteFactory(emitter),
    new UserFactory(users),
  );
}
