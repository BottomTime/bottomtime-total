import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { hash } from 'bcrypt';
import { Client } from 'pg';

const InsertUserQuery = `INSERT INTO users (
	id, email, "emailLowered", "emailVerified", "isLockedOut", "memberSince", name, "passwordHash", role, username, "usernameLowered"
) VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
);`;

const AdminUserId = '64ef7553-ed6a-44df-af85-71cb357dcc07';
const MemberSince = new Date();

export class PostgresFixture {
  static readonly adminPassword = 'admin1234';
  static readonly adminUser: UserDTO = {
    id: AdminUserId,
    email: 'admin@bottomti.me',
    emailVerified: true,
    isLockedOut: false,
    memberSince: MemberSince,
    hasPassword: true,
    profile: {
      userId: AdminUserId,
      username: 'admin',
      memberSince: MemberSince,
      name: 'Administrator',
    },
    role: UserRole.Admin,
    settings: {
      depthUnit: DepthUnit.Meters,
      pressureUnit: PressureUnit.Bar,
      temperatureUnit: TemperatureUnit.Celsius,
      weightUnit: WeightUnit.Kilograms,
    },
    username: 'admin',
  } as const;

  static get postgresUri(): string {
    return (
      process.env.BT_POSTGRES_TEST_URI ||
      'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_e2e'
    );
  }

  constructor(private readonly client: Client) {}

  async createAdmin(): Promise<UserDTO> {
    const passwordHash = await hash(PostgresFixture.adminPassword, 1);
    await this.client.query(InsertUserQuery, [
      PostgresFixture.adminUser.id,
      PostgresFixture.adminUser.email,
      PostgresFixture.adminUser.email,
      PostgresFixture.adminUser.emailVerified,
      PostgresFixture.adminUser.isLockedOut,
      PostgresFixture.adminUser.memberSince,
      PostgresFixture.adminUser.profile.name,
      passwordHash,
      PostgresFixture.adminUser.role,
      PostgresFixture.adminUser.username,
      PostgresFixture.adminUser.username,
    ]);

    return PostgresFixture.adminUser;
  }

  async purgeDatabase(): Promise<void> {
    const ProtectedTables = new Set([
      'geometry_columns',
      'geography_columns',
      'spatial_ref_sys',
      'migrations',
      'typeorm_metadata',
    ]);

    const tables = await this.client.query<{ table: string }>(
      `SELECT table_name AS table FROM information_schema.tables WHERE table_schema = 'public'`,
    );

    await Promise.all(
      tables.rows
        .filter(({ table }) => !ProtectedTables.has(table))
        .map(({ table }) => this.client.query(`DELETE FROM ${table}`)),
    );
  }
}
