import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
@Index(['user', 'friend'], { unique: true })
export class FriendshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity = new UserEntity();

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  friend: UserEntity = new UserEntity();

  @Column('timestamp')
  @Index()
  friendsSince: Date = new Date();
}
