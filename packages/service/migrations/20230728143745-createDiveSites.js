const DiveSitesCollection = 'DiveSites';

module.exports = {
  async up(db) {
    const collection = await db.createCollection(DiveSitesCollection);

    await Promise.all([
      collection.createIndex(
        {
          name: 'text',
          description: 'text',
          location: 'text',
          'reviews.title': 'text',
          'reviews.comments': 'text',
        },
        {
          name: 'DiveSites_text',
          weights: {
            name: 100,
            description: 50,
            location: 80,
            'reviews.title': 10,
            'reviews.comments': 5,
          },
        },
      ),
      collection.createIndex({ gps: '2dsphere' }, { name: 'DiveSites_gps' }),
      collection.createIndex({ name: 1 }, { name: 'DiveSites_name' }),
      collection.createIndex(
        { averageRating: -1 },
        {
          name: 'DiveSites_avgRating',
          sparse: true,
        },
      ),
      collection.createIndex(
        { averageDifficulty: 1 },
        {
          name: 'DiveSites_avgDifficulty',
          sparse: true,
        },
      ),
      collection.createIndex(
        { shoreAccess: 1 },
        {
          name: 'DiveSites_shoreAccess',
          sparse: true,
        },
      ),
      collection.createIndex(
        { freeToDive: 1 },
        {
          name: 'DiveSites_freeToDive',
          sparse: true,
        },
      ),
    ]);
  },

  async down(db) {
    await db.dropCollection(DiveSitesCollection);
  },
};
