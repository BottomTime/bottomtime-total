import { UserRole } from '@bottomtime/api';

import { UserEntity } from '@/data';

import { DataSource } from 'typeorm';

import { getDataSource } from './data-source';

/* eslint-disable no-console */
const DefaultAdminAccountId = '4a055f0a-0a9d-415d-8a36-93319e152055';
const DefaultAdminEmail = 'admin@bottomti.me';
const DefaultAdminUsername = 'Admin';
const DefaultAdminPasswordHash =
  '$2b$15$w/RXlIPZStVF.Y0LSs/q7e9UGtqQqct1eP.FrJEhXebN62SfN6KdC'; // "admin"
const AdminUser: Partial<UserEntity> = {
  id: DefaultAdminAccountId,
  email: DefaultAdminEmail,
  emailLowered: DefaultAdminEmail.toLowerCase(),
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  passwordHash: DefaultAdminPasswordHash,
  role: UserRole.Admin,
  username: DefaultAdminUsername,
  usernameLowered: DefaultAdminUsername.toLocaleLowerCase(),
};

export async function seedDatabase(postgresUri: string) {
  let ds: DataSource | undefined;

  try {
    console.log('Connecting to MongoDb...');
    ds = await getDataSource(postgresUri);

    console.log('Creating admin user account...');
    const users = ds.getRepository(UserEntity);

    const admin = await users.existsBy({ id: DefaultAdminAccountId });
    if (!admin) {
      const adminUser = new UserEntity();
      Object.assign(adminUser, AdminUser);
      await users.save(adminUser);
    }

    console.log('Database seeded.');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exitCode = 1;
  } finally {
    if (ds) await ds.destroy();
  }
}
