const DefaultAdminEmail = 'admin@bottomti.me';
const DefaultAdminUsername = 'Admin';
const DefaultAdminPasswordHash =
  '$2b$15$XmVrN6gsq3N2QZQhcP3qqOCKIPfcUkiUGE5nQlCEcGsXNY37vwk.G'; // "admin"
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

    // 3. Insert a default Admin account so we can sign in and start using the site right away.
    await users.insertOne({
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
