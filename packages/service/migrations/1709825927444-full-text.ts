import { MigrationInterface, QueryRunner } from 'typeorm';

export class FullText1709825927444 implements MigrationInterface {
  name = 'FullText1709825927444';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(name, '') || ' ' || username), 'A') || setweight(to_tsvector('english', coalesce(bio, '') || ' ' || coalesce(location, '')), 'B')) STORED NOT NULL`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'users',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(name, '') || ' ' || username), 'A') || setweight(to_tsvector('english', coalesce(bio, '') || ' ' || coalesce(location, '')), 'B')",
      ],
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || location), 'B') || setweight(to_tsvector('english', coalesce(directions, '')), 'C')) STORED NOT NULL`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'dive_sites',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || location), 'B') || setweight(to_tsvector('english', coalesce(directions, '')), 'C')",
      ],
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(comments, '')), 'B')) STORED NOT NULL`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'dive_site_reviews',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(comments, '')), 'B')",
      ],
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(agency, '') || ' ' || coalesce(course, '')), 'A')) STORED NOT NULL`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'certifications',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(agency, '') || ' ' || coalesce(course, '')), 'A')",
      ],
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c3fe5bb0dd3f7d7731b220c64"`,
    );
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "gps"`);
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "gps" point NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_387fcf43e89ac1f135bb9e47d0" ON "users" USING GIN ("fulltext") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c3fe5bb0dd3f7d7731b220c64" ON "dive_sites" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef83a1b1ac6d459f7a26958a6b" ON "dive_sites" USING GIN ("fulltext") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4605a0835b21a7625811e711f1" ON "dive_site_reviews" USING GIN ("fulltext") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ddecad614d8712070f735aacd6" ON "certifications" USING GIN ("fulltext") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ddecad614d8712070f735aacd6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4605a0835b21a7625811e711f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef83a1b1ac6d459f7a26958a6b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c3fe5bb0dd3f7d7731b220c64"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_387fcf43e89ac1f135bb9e47d0"`,
    );
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "gps"`);
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "gps" geometry(GEOMETRY,0) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c3fe5bb0dd3f7d7731b220c64" ON "dive_sites" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'fulltext',
        'bottomtime_local',
        'public',
        'certifications',
      ],
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" DROP COLUMN "fulltext"`,
    );
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'fulltext',
        'bottomtime_local',
        'public',
        'dive_site_reviews',
      ],
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP COLUMN "fulltext"`,
    );
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'fulltext',
        'bottomtime_local',
        'public',
        'dive_sites',
      ],
    );
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "fulltext"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      ['GENERATED_COLUMN', 'fulltext', 'bottomtime_local', 'public', 'users'],
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fulltext"`);
  }
}
