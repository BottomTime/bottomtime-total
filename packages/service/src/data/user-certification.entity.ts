import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
@Index(['agency', 'course'])
export class UserCertificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, (user) => user.certifications, {
    onDelete: 'CASCADE',
  })
  user: UserEntity = new UserEntity();

  @Column({ type: 'varchar', length: 100 })
  agency: string = '';

  @Column({ type: 'varchar', length: 200 })
  course: string = '';

  @Column({ type: 'timestamp' })
  date?: Date;
}
