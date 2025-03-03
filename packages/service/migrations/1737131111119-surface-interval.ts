import { MigrationInterface, QueryRunner } from 'typeorm';

export class SurfaceInterval1737131111119 implements MigrationInterface {
  name = 'SurfaceInterval1737131111119';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "surfaceInterval" double precision`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4605a0835b21a7625811e711f1"`,
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
        'dive_site_reviews',
      ],
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(comments, '')), 'A')) STORED`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'dive_site_reviews',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(comments, '')), 'A')",
      ],
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4605a0835b21a7625811e711f1" ON "dive_site_reviews" ("fulltext") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4605a0835b21a7625811e711f1"`,
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
      `ALTER TABLE "dive_site_reviews" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(comments, '')), 'B')) STORED`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4605a0835b21a7625811e711f1" ON "dive_site_reviews" ("fulltext") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "surfaceInterval"`,
    );
  }
}
