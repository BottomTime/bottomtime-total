import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('certifications')
@Index(['agency', 'course'])
export class CertificationEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 100 })
  agency: string = '';

  @Column({ type: 'varchar', length: 200 })
  course: string = '';
}
