import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['agency', 'course'])
export class CertificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 100 })
  agency: string = '';

  @Column({ type: 'varchar', length: 200 })
  course: string = '';
}
