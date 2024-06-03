import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
@Index(['user', 'key'], { unique: true })
export class UserJsonDataEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  user?: UserEntity;

  @Column('varchar', { length: 200, nullable: false })
  key: string = '';

  @Column('json', { nullable: false })
  value: string = '';
}
