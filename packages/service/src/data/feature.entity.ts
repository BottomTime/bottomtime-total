import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('features')
export class FeatureEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn({})
  updatedAt: Date = new Date();

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  key: string = '';

  @Column({ type: 'varchar', length: 255 })
  @Index()
  name: string = '';

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string | null = null;

  @Column({ type: 'boolean', default: false })
  enabled: boolean = false;
}
