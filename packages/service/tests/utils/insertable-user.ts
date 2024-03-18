import { UserEntity } from '../../src/data';

export type InsertableUser = Omit<
  UserEntity,
  'certifications' | 'customData' | 'friends' | 'fulltext' | 'oauth' | 'tanks'
>;
