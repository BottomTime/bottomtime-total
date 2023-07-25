const SessionsCollection = 'Sessions';

module.exports = {
  async up(db) {
    await db.dropCollection(SessionsCollection);
  },

  async down(db) {
    await db.createCollection(SessionsCollection);
    const sessions = db.collection(SessionsCollection);

    await sessions.createIndex(
      { expires: 1 },
      {
        name: 'expires_1',
        expireAfterSeconds: 0,
      },
    );
  },
};
