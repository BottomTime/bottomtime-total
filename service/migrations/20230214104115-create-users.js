const DefaultAdminAccountId = '4a055f0a-0a9d-415d-8a36-93319e152055';
const DefaultAdminEmail = 'admin@bottomti.me';
const DefaultAdminUsername = 'Admin';
const DefaultAdminPasswordHash =
  '$2b$15$w/RXlIPZStVF.Y0LSs/q7e9UGtqQqct1eP.FrJEhXebN62SfN6KdC'; // "admin"
const UsersCollection = 'Users';

module.exports = {
  async up(db) {
    // 1. Create Users collection.
    await db.createCollection(UsersCollection);
    const users = db.collection(UsersCollection);

    // 2. Create indexes on fields used to find and authenticate users.
    await users.createIndex(
      { usernameLowered: 1 },
      {
        unique: true,
        name: 'users_usernameLowered',
      },
    );
    await users.createIndex(
      { emailLowered: 1 },
      {
        unique: true,
        name: 'users_emailLowered',
      },
    );
    await users.createIndex(
      { 'profile.profileVisibility': 1 },
      {
        sparse: true,
        name: 'users_profileVisibility',
      },
    );
    await users.createIndex(
      {
        email: 'text',
        username: 'text',

        'profile.bio': 'text',
        'profile.location': 'text',
        'profile.name': 'text',
      },
      {
        weights: {
          email: 90,
          username: 90,

          'profile.bio': 50,
          'proflie.location': 50,
          'profile.name': 100,
        },
        name: 'users_text',
      },
    );

    // 3. Insert a default Admin account so we can sign in and start using the site right away.
    await users.insertOne({
      _id: DefaultAdminAccountId,
      email: DefaultAdminEmail,
      emailLowered: DefaultAdminEmail.toLowerCase(),
      emailVerified: true,
      isLockedOut: false,
      memberSince: new Date(),
      passwordHash: DefaultAdminPasswordHash,
      role: 'admin',
      username: DefaultAdminUsername,
      usernameLowered: DefaultAdminUsername.toLocaleLowerCase(),
    });
  },

  async down(db) {
    await db.dropCollection(UsersCollection);
  },
};
