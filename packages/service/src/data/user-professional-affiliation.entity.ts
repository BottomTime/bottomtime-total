import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { AgencyEntity } from './agency.entity';
import { UserEntity } from './user.entity';

@Entity('user_professional_affiliations')
export class UserProfessionalAffiliationEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => AgencyEntity, { onDelete: 'CASCADE' })
  agency?: AgencyEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @Index()
  user?: UserEntity;

  @Column({ type: 'varchar', length: 200 })
  title: string = '';

  @Column({ type: 'varchar', length: 100 })
  identificationNumber: string = '';

  @Column({ type: 'varchar', length: 20, nullable: true })
  startDate: string | null = null;
}
