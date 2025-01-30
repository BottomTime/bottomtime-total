import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiveSiteReviewsIndexing1738244203191
  implements MigrationInterface
{
  name = 'DiveSiteReviewsIndexing1738244203191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f91b251bfbf2300f6a01877e0a"`,
    );
    await queryRunner.query(
      `UPDATE "dive_site_reviews" SET "updatedOn" = "createdOn" WHERE "updatedOn" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ALTER COLUMN "updatedOn" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f869c30544eb7c71b9311c0ad6" ON "dive_site_reviews" ("updatedOn") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f869c30544eb7c71b9311c0ad6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ALTER COLUMN "updatedOn" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f91b251bfbf2300f6a01877e0a" ON "dive_site_reviews" ("createdOn") `,
    );
  }
}
