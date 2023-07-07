const UsersCollection = 'Users';
const IndexName = 'users_friendIds';

module.exports = {
  async up(db) {
    const collection = db.collection(UsersCollection);
    await collection.createIndex(
      {
        'friends.friendId': 1,
      },
      {
        name: IndexName,
        sparse: true,
      },
    );
  },

  async down(db) {
    const collection = db.collection(UsersCollection);
    await collection.dropIndex(IndexName);
  },
};
