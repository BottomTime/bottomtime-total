import { UserEntity } from '../../src/data';
import { UserFactory } from '../../src/users';
import { dataSource } from '../data-source';

export function createUserFactory(): UserFactory {
  return new UserFactory(dataSource.getRepository(UserEntity));
}
