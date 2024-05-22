import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../src/data';
import { DiveSiteFactory } from '../../src/diveSites/dive-site-factory';
import { dataSource } from '../data-source';

export function createDiveSiteFactory(
  emitter?: EventEmitter2,
): DiveSiteFactory {
  return new DiveSiteFactory(
    dataSource.getRepository(UserEntity),
    dataSource.getRepository(DiveSiteEntity),
    dataSource.getRepository(DiveSiteReviewEntity),
    emitter ?? new EventEmitter2(),
  );
}
