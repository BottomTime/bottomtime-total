import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Point,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { MediaFileEntity } from './media-file.entity';
import { UserEntity } from './user.entity';

@Entity('dive_operators')
export class DiveOperatorEntity {
  // Metadata
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  owner?: UserEntity;

  @ManyToMany(() => UserEntity, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: true,
  })
  maintainers?: UserEntity[];

  @Column({ type: 'boolean', nullable: false, default: true })
  @Index()
  active: boolean = true;

  // Contact Info
  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string = '';

  @Column({ type: 'varchar', length: 200 })
  @Index({ unique: true })
  slug: string = '';

  @Column({ type: 'boolean', nullable: false })
  verified: boolean = false;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string | null = null;

  @Column({ type: 'geography', nullable: true })
  @Index({ spatial: true, sparse: true })
  gps: Point | null = null;

  // Socials
  @Column({ type: 'varchar', length: 100, nullable: true })
  facebook: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  instagram: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tiktok: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  twitter: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  youtube: string | null = null;

  // Media
  @Column({ type: 'varchar', length: 200, nullable: true })
  logo: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  banner: string | null = null;

  @OneToMany(() => MediaFileEntity, (file) => file.diveOperator)
  media?: MediaFileEntity[];

  // Other
  @ManyToMany(() => DiveSiteEntity, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: true,
  })
  @JoinTable({
    name: 'dive_operator_sites',
  })
  diveSites?: DiveSiteEntity[];

  @Column({
    type: 'tsvector',
    select: false,
    nullable: false,
    insert: false,
    update: false,
    asExpression: `setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(address, '')), 'B')`,
    generatedType: 'STORED',
  })
  @Index()
  fulltext?: string;
}
