import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('alerts')
export class AlertEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 100 })
  icon: string = '';

  @Column({ type: 'varchar', length: 200 })
  title: string = '';

  @Column('text')
  message: string = '';

  @Column('timestamp')
  @Index()
  active: Date = new Date();

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expires: Date | null = null;

  @ManyToMany(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'alert_dismissals' })
  dismissals?: UserEntity[];
}
