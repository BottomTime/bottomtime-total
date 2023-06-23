const CollectionName = 'Applications';

module.exports = {
  async up(db) {
    const collection = await db.createCollection(CollectionName);
    await Promise.all([
      collection.createIndex(
        { token: 1 },
        {
          name: 'Applications_token',
          unique: true,
        },
      ),
      collection.createIndex(
        { name: 1 },
        {
          name: 'Applications_name',
          unique: true,
        },
      ),
      collection.createIndex({ user: 1 }, { name: 'Applications_user' }),
      collection.createIndex(
        {
          name: 'text',
          description: 'text',
        },
        {
          name: 'Application_text',
          weights: {
            name: 20,
            description: 10,
          },
        },
      ),
    ]);
  },

  async down(db) {
    await db.dropCollection(CollectionName);
  },
};
