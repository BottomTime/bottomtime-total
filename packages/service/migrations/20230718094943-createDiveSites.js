const DiveSitesCollection = 'DiveSites';

module.exports = {
  async up(db) {
    const collection = await db.createCollection(DiveSitesCollection);

    await collection.createIndex(
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
    );
    await collection.createIndex(
      { shoreAccess: 1 },
      {
        name: 'DiveSites_shoreAccess',
        sparse: true,
      },
    );
    await collection.createIndex(
      { freeToDive: 1 },
      {
        name: 'DiveSites_freeToDive',
        sparse: true,
      },
    );
  },

  async down(db) {
    await db.dropCollection(DiveSitesCollection);
  },
};
