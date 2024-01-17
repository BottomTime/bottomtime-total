const CertificationsCollection = 'KnownCertifications';
const IndexName = 'KnownCertifications_agency_course_text';

module.exports = {
  async up(db) {
    const certifications = db.collection(CertificationsCollection);
    await certifications.createIndex(
      { course: 'text', agency: 'text' },
      {
        weights: {
          course: 100,
          agency: 50,
        },
        name: IndexName,
      },
    );
  },

  async down(db) {
    const certifications = db.collection(CertificationsCollection);
    await certifications.dropIndex(IndexName);
  },
};
