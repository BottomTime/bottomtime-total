import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('friendships')
@Index(['user', 'friend'], { unique: true })
export class FriendshipEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, (user) => user.friends, { onDelete: 'CASCADE' })
  user: UserEntity = new UserEntity();

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  friend: UserEntity = new UserEntity();

  @Column('timestamp')
  @Index()
  friendsSince: Date = new Date();
}
