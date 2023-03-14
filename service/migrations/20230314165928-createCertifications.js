const CertificationsCollection = 'KnownCertifications';

module.exports = {
  async up(db) {
    await db.createCollection(CertificationsCollection);
    const certifications = db.collection(CertificationsCollection);

    await certifications.createIndex(
      {
        course: 1,
        agency: 1,
      },
      {
        unique: true,
        name: 'knownCertifications_agency_course',
      },
    );
  },

  async down(db) {
    await db.dropCollection(CertificationsCollection);
  },
};
