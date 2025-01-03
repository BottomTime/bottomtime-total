import { OperatorEntity, OperatorReviewEntity } from '../../src/data';
import { OperatorFactory } from '../../src/operators';
import { dataSource } from '../data-source';

export function createOperatorFactory(): OperatorFactory {
  return new OperatorFactory(
    dataSource.getRepository(OperatorEntity),
    dataSource.getRepository(OperatorReviewEntity),
  );
}
