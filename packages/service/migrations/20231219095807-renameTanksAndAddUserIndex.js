const OldCollectionName = 'PreDefinedTanks';
const NewCollectionName = 'Tanks';
const NameIndexName = 'tanks_name';
const UserIndexName = 'tanks_user';

module.exports = {
  async up(db) {
    await db.dropCollection(OldCollectionName);

    const tanks = await db.createCollection(NewCollectionName);
    await tanks.createIndex(
      { name: 1 },
      {
        name: NameIndexName,
        unique: false,
      },
    );
    await tanks.createIndex(
      { user: 1 },
      {
        unique: false,
        sparse: true,
        name: UserIndexName,
      },
    );
  },

  async down(db) {
    await db.dropCollection(NewCollectionName);

    const tanks = await db.createCollection(OldCollectionName);
    await tanks.createIndex(
      { name: 1 },
      {
        name: NameIndexName,
        unique: true,
      },
    );
  },
};
