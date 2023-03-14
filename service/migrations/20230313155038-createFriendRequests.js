const FriendRequestsCollection = 'FriendRequests';

module.exports = {
  async up(db) {
    await db.createCollection(FriendRequestsCollection);
    const friendRequests = db.collection(FriendRequestsCollection);

    await friendRequests.createIndex(
      {
        to: 1,
        from: 1,
      },
      {
        unique: true,
        name: 'friendRequests_to_from',
      },
    );
    await friendRequests.createIndex(
      { expires: 1 },
      {
        expireAfterSeconds: 0,
        name: 'friendRequests_expires_ttl',
      },
    );
  },

  async down(db) {
    await db.dropCollection(FriendRequestsCollection);
  },
};
