const UsersCollection = 'Users';
const FriendsCollection = 'Friends';
const OldIndexName = 'users_friendIds';

const UserFriendIndex = 'friends_userIdFriendId';
const FriendsSinceIndex = 'friends_friendsSince';

module.exports = {
  async up(db) {
    const users = db.collection(UsersCollection);
    await users.dropIndex(OldIndexName);

    const friends = await db.createCollection(FriendsCollection);
    await friends.createIndex(
      { userId: 1, friendId: 1 },
      { name: UserFriendIndex, unique: true },
    );
    await friends.createIndex({ friendsSince: 1 }, { name: FriendsSinceIndex });
  },

  async down(db) {
    await db.dropCollection(FriendsCollection);

    const users = db.collection(UsersCollection);
    await users.createIndex(
      {
        'friends.friendId': 1,
      },
      {
        name: OldIndexName,
        sparse: true,
      },
    );
  },
};
