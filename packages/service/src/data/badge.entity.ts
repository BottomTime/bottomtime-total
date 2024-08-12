import { Column, Entity, Index, ManyToMany, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('badges')
export class BadgeEntity {
  @PrimaryColumn('varchar', { length: 100 })
  key: string = '';

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string = '';

  @Column({ type: 'varchar', length: 1000 })
  description: string = '';

  @Column('int')
  xpValue: number = 0;

  @ManyToMany(() => UserEntity, (user) => user.badges)
  users?: UserEntity[];
}
