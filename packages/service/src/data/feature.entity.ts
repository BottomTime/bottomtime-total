import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('features')
export class FeatureEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  name: string = '';

  @Column({ type: 'varchar', length: 2000 })
  description: string = '';

  @Column({ type: 'boolean', default: false })
  enabled: boolean = false;
}
