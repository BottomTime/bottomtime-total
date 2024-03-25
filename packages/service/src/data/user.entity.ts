import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { FriendshipEntity } from './friendship.entity';
import { TankEntity } from './tank.entity';
import { UserCertificationEntity } from './user-certification.entity';
import { UserOAuthEntity } from './user-oauth.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 150, nullable: true })
  avatar: string | null = null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  bio: string | null = null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthdate: string | null = null;

  @OneToMany(
    () => UserCertificationEntity,
    (certification) => certification.user,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  certifications?: UserCertificationEntity[];

  @Column({ type: 'json', nullable: true })
  customData: Record<string, unknown> | null = null;

  @Column({
    type: 'enum',
    enum: DepthUnit,
    default: DepthUnit.Meters,
    nullable: true,
  })
  depthUnit: DepthUnit = DepthUnit.Meters;

  @Column({ type: 'varchar', length: 50, nullable: true })
  email: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index({ unique: true })
  emailLowered?: string | null = null;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean = false;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emailVerificationToken: string | null = null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpiration: Date | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  experienceLevel: string | null = null;

  @OneToMany(() => FriendshipEntity, (friendship) => friendship.user)
  friends?: FriendshipEntity[];

  @Column({ type: 'boolean', default: false })
  @Index()
  isLockedOut: boolean = false;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null = null;

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordChange: Date | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  location: string | null = null;

  @CreateDateColumn()
  @Index()
  memberSince: Date = new Date();

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null = null;

  @OneToMany(() => UserOAuthEntity, (oauth) => oauth.user, {
    onDelete: 'CASCADE',
  })
  oauth?: UserOAuthEntity[];

  @Column('varchar', { length: 100, nullable: true })
  passwordHash: string | null = null;

  @Column('varchar', { length: 100, nullable: true })
  passwordResetToken: string | null = null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiration: Date | null = null;

  @Column({
    type: 'enum',
    enum: PressureUnit,
    default: PressureUnit.Bar,
    nullable: true,
  })
  pressureUnit: PressureUnit = PressureUnit.Bar;

  @OneToMany(() => TankEntity, (tank) => tank.user, { onDelete: 'CASCADE' })
  tanks?: TankEntity[];

  @Column({
    type: 'enum',
    enum: TemperatureUnit,
    default: TemperatureUnit.Celsius,
    nullable: true,
  })
  temperatureUnit: TemperatureUnit = TemperatureUnit.Celsius;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.User,
  })
  @Index()
  role: UserRole = UserRole.User;

  @Column({ type: 'varchar', length: 10, nullable: true })
  startedDiving: string | null = null;

  @Column({ type: 'varchar', length: 50 })
  username: string = '';

  @Column({ type: 'varchar', length: 50 })
  @Index({ unique: true })
  usernameLowered: string = '';

  @Column({
    type: 'enum',
    enum: WeightUnit,
    default: WeightUnit.Kilograms,
    nullable: true,
  })
  weightUnit: WeightUnit = WeightUnit.Kilograms;

  @Column({
    type: 'tsvector',
    select: false,
    nullable: true,
    insert: false,
    update: false,
    asExpression: `setweight(to_tsvector('english', coalesce(name, '') || ' ' || username), 'A') || setweight(to_tsvector('english', coalesce(bio, '') || ' ' || coalesce(location, '')), 'B')`,
    generatedType: 'STORED',
  })
  @Index()
  fulltext?: unknown;
}
