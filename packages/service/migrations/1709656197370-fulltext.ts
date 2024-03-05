import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fulltext1709656197370 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN fulltext tsvector GENERATED ALWAYS AS (to_tsvector('english', username || ' ' || COALESCE(name, '') || ' ' || COALESCE(bio, '') || ' ' || COALESCE(email, ''))) STORED`,
    );
    await queryRunner.query(
      `CREATE INDEX users_fulltext_idx ON users USING GIN (fulltext)`,
    );

    await queryRunner.query(
      `ALTER TABLE dive_site_reviews ADD COLUMN fulltext tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || COALESCE(comments, ''))) STORED`,
    );
    await queryRunner.query(
      `CREATE INDEX dive_site_reviews_fulltext_idx ON dive_site_reviews USING GIN (fulltext)`,
    );

    await queryRunner.query(
      `ALTER TABLE dive_sites ADD COLUMN fulltext tsvector GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(directions, ''))) STORED`,
    );
    await queryRunner.query(
      `CREATE INDEX dive_sites_fulltext_idx ON dive_sites USING GIN (fulltext)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX users_fulltext_idx`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN fulltext`);

    await queryRunner.query(`DROP INDEX dive_site_reviews_fulltext_idx`);
    await queryRunner.query(
      `ALTER TABLE dive_site_reviews DROP COLUMN fulltext`,
    );

    await queryRunner.query(`DROP INDEX dive_sites_fulltext_idx`);
    await queryRunner.query(`ALTER TABLE dive_sites DROP COLUMN fulltext`);
  }
}
