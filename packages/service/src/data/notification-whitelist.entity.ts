import { NotificationType } from '@bottomtime/api';

import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('notification_whitelists')
@Index(['user', 'type'], { unique: true })
export class NotificationWhitelistEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column('enum', { enum: NotificationType })
  type: NotificationType = NotificationType.Email;

  @Column('varchar', { array: true, length: 255, default: ['*'] })
  whitelist: string[] = ['*'];
}
