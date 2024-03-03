import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
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
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TankEntity } from './tank.entity';
import { UserCertificationEntity } from './user-certification.entity';
import { UserOAuthEntity } from './user-oauth.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 150 })
  avatar?: string;

  @Column({ type: 'varchar', length: 1000 })
  bio?: string;

  @Column({ type: 'varchar', length: 10 })
  birthdate?: string;

  @OneToMany(
    () => UserCertificationEntity,
    (certification) => certification.user,
    {
      onDelete: 'CASCADE',
    },
  )
  certifications?: UserCertificationEntity[] = [];

  @Column({ type: 'json' })
  customData?: Record<string, unknown>;

  @Column({ type: 'enum', enum: DepthUnit, default: DepthUnit.Meters })
  depth: DepthUnit = DepthUnit.Meters;

  @Column({ type: 'varchar', length: 50 })
  email?: string;

  @Column({ type: 'varchar', length: 50 })
  @Index({ unique: true })
  emailLowered?: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean = false;

  @Column({ type: 'varchar', length: 50 })
  emailVerificationToken?: string;

  @Column({ type: 'timestamp' })
  emailVerificationTokenExpiration?: Date;

  @Column({ type: 'varchar', length: 50 })
  experienceLevel?: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  isLockedOut: boolean = false;

  @Column({ type: 'timestamp' })
  lastLogin?: Date;

  @Column({ type: 'timestamp' })
  lastPasswordChange?: Date;

  @Column({ type: 'varchar', length: 50 })
  location?: string;

  @CreateDateColumn()
  @Index()
  memberSince: Date = new Date();

  @Column({ type: 'varchar', length: 100 })
  name?: string;

  @OneToMany(() => UserOAuthEntity, (oauth) => oauth.user, {
    onDelete: 'CASCADE',
  })
  oauth?: UserOAuthEntity[] = [];

  @Column()
  passwordHash?: string;

  @Column()
  passwordResetToken?: string;

  @Column({ type: 'timestamp' })
  passwordResetTokenExpiration?: Date;

  @Column({ type: 'enum', enum: PressureUnit, default: PressureUnit.Bar })
  pressureUnit: PressureUnit = PressureUnit.Bar;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.FriendsOnly,
  })
  profileVisibility: ProfileVisibility = ProfileVisibility.FriendsOnly;

  @OneToMany(() => TankEntity, (tank) => tank.user, { onDelete: 'CASCADE' })
  tanks?: TankEntity[];

  @Column({
    type: 'enum',
    enum: TemperatureUnit,
    default: TemperatureUnit.Celsius,
  })
  temperatureUnit: TemperatureUnit = TemperatureUnit.Celsius;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.User,
  })
  @Index()
  role: UserRole = UserRole.User;

  @Column({ type: 'varchar', length: 10 })
  startedDiving?: string;

  @Column({ type: 'varchar', length: 50 })
  username: string = '';

  @Column({ type: 'varchar', length: 50 })
  @Index({ unique: true })
  usernameLowered: string = '';

  @Column({ type: 'enum', enum: WeightUnit, default: WeightUnit.Kilograms })
  weightUnit: WeightUnit = WeightUnit.Kilograms;
}
