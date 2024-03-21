import { MigrationInterface, QueryRunner } from 'typeorm';

export class CascadeDeleteReviews1711024394210 implements MigrationInterface {
  name = 'CascadeDeleteReviews1711024394210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
