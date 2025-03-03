import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { AgencyEntity } from './agency.entity';

@Entity('certifications')
@Index(['agency', 'course'])
export class CertificationEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => AgencyEntity, { onDelete: 'CASCADE' })
  agency?: AgencyEntity;

  @Column({ type: 'varchar', length: 200 })
  course: string = '';
}
