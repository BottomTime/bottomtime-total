/* eslint-disable no-console */
import { MongoClient } from 'mongodb';

import { Collections, UserData } from '../../src/schemas';

const DefaultAdminAccountId = '4a055f0a-0a9d-415d-8a36-93319e152055';
const DefaultAdminEmail = 'admin@bottomti.me';
const DefaultAdminUsername = 'Admin';
const DefaultAdminPasswordHash =
  '$2b$15$w/RXlIPZStVF.Y0LSs/q7e9UGtqQqct1eP.FrJEhXebN62SfN6KdC'; // "admin"
const AdminUser: UserData = {
  _id: DefaultAdminAccountId,
  email: DefaultAdminEmail,
  emailLowered: DefaultAdminEmail.toLowerCase(),
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  passwordHash: DefaultAdminPasswordHash,
  role: 200,
  username: DefaultAdminUsername,
  usernameLowered: DefaultAdminUsername.toLocaleLowerCase(),
};

export async function seedDatabase(mongoUri: string) {
  console.log('Connecting to MongoDb...');
  const mongoClient = await MongoClient.connect(mongoUri);
  const db = mongoClient.db();
  const userCollection = db.collection<UserData>(Collections.Users);

  console.log('Creating admin user account...');
  const admin = await userCollection.findOne(
    { _id: DefaultAdminAccountId },
    { projection: { _id: 1 } },
  );
  if (!admin) {
    await userCollection.insertOne(AdminUser);
  }

  console.log('Database seeded.');
}
