import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { AgencyEntity } from './agency.entity';
import { UserEntity } from './user.entity';

@Entity('user_certifications')
@Index(['agency', 'course'])
export class UserCertificationEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, (user) => user.certifications, {
    onDelete: 'CASCADE',
  })
  user: UserEntity = new UserEntity();

  @ManyToOne(() => AgencyEntity, { onDelete: 'CASCADE' })
  agency?: AgencyEntity;

  @Column({ type: 'varchar', length: 200 })
  course: string = '';

  @Column({ type: 'varchar', length: 10, nullable: true })
  date?: string;
}
