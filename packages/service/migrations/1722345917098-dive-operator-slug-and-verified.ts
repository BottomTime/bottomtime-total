import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiveOperatorSlugAndVerified1722345917098
  implements MigrationInterface
{
  name = 'DiveOperatorSlugAndVerified1722345917098';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "slug" character varying(200) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "verified" boolean NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0ef013bfa5c227e8311d4f5e55" ON "dive_operators" ("slug") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ef013bfa5c227e8311d4f5e55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "verified"`,
    );
    await queryRunner.query(`ALTER TABLE "dive_operators" DROP COLUMN "slug"`);
  }
}
