import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiveSitesAggregates1710258935312 implements MigrationInterface {
  name = 'DiveSitesAggregates1710258935312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "averageRating" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "averageDifficulty" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ALTER COLUMN "gps" TYPE geography`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3cea0cca732f3c97f82edaf562" ON "dive_sites" ("averageRating") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cea0cca732f3c97f82edaf562"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ALTER COLUMN "gps" TYPE geography(Geometry,0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" DROP COLUMN "averageDifficulty"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" DROP COLUMN "averageRating"`,
    );
  }
}
