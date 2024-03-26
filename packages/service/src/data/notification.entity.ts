import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 100 })
  icon: string = '';

  @Column({ type: 'varchar', length: 200 })
  title: string = '';

  @Column({ type: 'varchar', length: 2000 })
  message: string = '';

  @Column('timestamp')
  @Index()
  active: Date = new Date();

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expires: Date | null = null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  recipient?: UserEntity;

  @Column('boolean')
  dismissed: boolean = false;
}
