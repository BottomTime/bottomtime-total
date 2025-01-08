import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewsUpdate1735824085873 implements MigrationInterface {
  name = 'ReviewsUpdate1735824085873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6e8363710abb3520fa68ed3163"`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'dive_operator_reviews',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(comments, '')), 'A')",
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "dive_operator_reviews" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "rating" double precision NOT NULL, "comments" character varying(1000), "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(comments, '')), 'A')) STORED, "creatorId" uuid, "operatorId" uuid, "logEntryId" uuid, CONSTRAINT "PK_65dcced1b3df182b32cd0d72720" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8bcfe49632985aea9baacee4ec" ON "dive_operator_reviews" ("creatorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c66c7c21579b55f7309bb8932d" ON "dive_operator_reviews" ("logEntryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_303ee887bf816fd55c6a6540c7" ON "dive_operator_reviews" ("rating") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe199c93a281b58e7a1aaaf378" ON "dive_operator_reviews" ("fulltext") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ec6ad3ecdcc6d7935b218111f9" ON "dive_operator_reviews" ("operatorId", "creatorId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "averageRating" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "rating" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "operatorId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP COLUMN "fulltext"`,
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
      `ALTER TABLE "dive_site_reviews" ADD "logEntryId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf11dd9898ed0aafe5d84f73d2" ON "dive_operators" ("averageRating") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a81a1a8479307932159eb1b437" ON "log_entries" ("rating") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_022dd51f87f0f021ad3182e1f4" ON "dive_site_reviews" ("logEntryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4605a0835b21a7625811e711f1" ON "dive_site_reviews" ("fulltext") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP COLUMN "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_reviews" ADD CONSTRAINT "FK_8bcfe49632985aea9baacee4ec4" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_reviews" ADD CONSTRAINT "FK_f1702ec4d4dd1823a81fbbce6ad" FOREIGN KEY ("operatorId") REFERENCES "dive_operators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_reviews" ADD CONSTRAINT "FK_c66c7c21579b55f7309bb8932d1" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_3ad6439ec89a443dec0ca46082d" FOREIGN KEY ("operatorId") REFERENCES "dive_operators"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_022dd51f87f0f021ad3182e1f4d" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_022dd51f87f0f021ad3182e1f4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_3ad6439ec89a443dec0ca46082d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_reviews" DROP CONSTRAINT "FK_c66c7c21579b55f7309bb8932d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_reviews" DROP CONSTRAINT "FK_f1702ec4d4dd1823a81fbbce6ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_reviews" DROP CONSTRAINT "FK_8bcfe49632985aea9baacee4ec4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4605a0835b21a7625811e711f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_022dd51f87f0f021ad3182e1f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a81a1a8479307932159eb1b437"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bf11dd9898ed0aafe5d84f73d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP COLUMN "logEntryId"`,
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
      `ALTER TABLE "log_entries" DROP COLUMN "operatorId"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "rating"`);
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "averageRating"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD "title" character varying(200) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec6ad3ecdcc6d7935b218111f9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe199c93a281b58e7a1aaaf378"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_303ee887bf816fd55c6a6540c7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c66c7c21579b55f7309bb8932d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8bcfe49632985aea9baacee4ec"`,
    );
    await queryRunner.query(`DROP TABLE "dive_operator_reviews"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'fulltext',
        'bottomtime_local',
        'public',
        'dive_operator_reviews',
      ],
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e8363710abb3520fa68ed3163" ON "dive_site_reviews" ("title") `,
    );
  }
}
