const TanksCollection = 'PreDefinedTanks';

module.exports = {
  async up(db) {
    await db.createCollection(TanksCollection);
    const tanks = db.collection(TanksCollection);

    await tanks.createIndex(
      {
        name: 1,
      },
      {
        unique: true,
        name: 'tanks_name',
      },
    );
  },

  async down(db) {
    await db.dropCollection(TanksCollection);
  },
};
