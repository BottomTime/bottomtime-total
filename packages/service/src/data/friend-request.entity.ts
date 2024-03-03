import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
export class FriendRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  from: UserEntity = new UserEntity();

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  to: UserEntity = new UserEntity();

  @CreateDateColumn()
  @Index()
  created: Date = new Date();

  @Column('timestamp')
  @Index()
  expires: Date = new Date();

  @Column('boolean')
  accepted?: boolean = false;

  @Column('varchar', { length: 500 })
  reason?: string;
}
