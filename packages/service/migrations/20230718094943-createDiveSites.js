const DiveSitesCollection = 'DiveSites';

module.exports = {
  async up(db) {
    const collection = await db.createCollection(DiveSitesCollection);
  },

  async down(db) {
    await db.dropCollection(DiveSitesCollection);
  },
};
