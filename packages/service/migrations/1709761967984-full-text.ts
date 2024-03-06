import { MigrationInterface, QueryRunner } from 'typeorm';

export class FullText1709761967984 implements MigrationInterface {
  name = 'FullText1709761967984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fulltext" tsvector GENERATED ALWAYS AS (to_tsvector('english', "username" || ' ' || coalesce("bio", '') || ' ' || coalesce("name", ''))) STORED `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "fulltext" tsvector GENERATED ALWAYS AS (to_tsvector('english', "name" || ' ' || coalesce("description", '') || ' ' || "location" || ' ' || coalesce("directions", ''))) STORED`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD "fulltext" tsvector GENERATED ALWAYS AS (to_tsvector('english', "title" || ' ' || coalesce("comments", ''))) STORED`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" ADD "fulltext" tsvector GENERATED ALWAYS AS (to_tsvector('english', "agency" || ' ' || "course")) STORED`,
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
      `ALTER TABLE "certifications" DROP COLUMN "fulltext"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP COLUMN "fulltext"`,
    );
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "fulltext"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fulltext"`);
  }
}
