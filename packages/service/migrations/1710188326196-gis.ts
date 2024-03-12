import { MigrationInterface, QueryRunner } from 'typeorm';

export class Gis1710188326196 implements MigrationInterface {
  name = 'Gis1710188326196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c3fe5bb0dd3f7d7731b220c64"`,
    );
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "gps"`);
    await queryRunner.query(`ALTER TABLE "dive_sites" ADD "gps" geography`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4c3fe5bb0dd3f7d7731b220c64" ON "dive_sites" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c3fe5bb0dd3f7d7731b220c64"`,
    );
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "gps"`);
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "gps" point NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c3fe5bb0dd3f7d7731b220c64" ON "dive_sites" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
