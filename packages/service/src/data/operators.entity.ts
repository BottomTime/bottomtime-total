import { VerificationStatus } from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Point,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { LogEntryEntity } from './log-entry.entity';
import { MediaFileEntity } from './media-file.entity';
import { OperatorDiveSiteEntity } from './operator-dive-site.entity';
import { OperatorReviewEntity } from './operator-review.entity';
import { OperatorTeamMemberEntity } from './operator-team-member.entity';
import { UserEntity } from './user.entity';

@Entity('dive_operators')
export class OperatorEntity {
  // Metadata
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @DeleteDateColumn()
  deletedAt: Date | null = null;

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

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.Unverified,
  })
  @Index()
  verificationStatus: VerificationStatus = VerificationStatus.Unverified;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  verificationMessage: string | null = null;

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

  @Column({
    type: 'geography',
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
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
  @OneToMany(() => OperatorDiveSiteEntity, (relation) => relation.operator, {
    onDelete: 'CASCADE',
  })
  diveSites?: DiveSiteEntity[];

  @OneToMany(() => LogEntryEntity, (entry) => entry.operator, {
    onDelete: 'CASCADE',
  })
  loggedDives?: LogEntryEntity[];

  @OneToMany(() => OperatorReviewEntity, (review) => review.operator, {
    onDelete: 'CASCADE',
  })
  reviews?: OperatorReviewEntity[];

  @OneToMany(() => OperatorTeamMemberEntity, (member) => member.operator, {
    onDelete: 'CASCADE',
  })
  teamMembers?: OperatorTeamMemberEntity[];

  @Column({ type: 'float', nullable: true })
  @Index()
  averageRating: number | null = null;

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
