import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaterType1716904879307 implements MigrationInterface {
  name = 'AddWaterType1716904879307';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."dive_sites_watertype_enum" AS ENUM('salt', 'fresh', 'mixed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD "waterType" "public"."dive_sites_watertype_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dive_sites" DROP COLUMN "waterType"`);
    await queryRunner.query(`DROP TYPE "public"."dive_sites_watertype_enum"`);
  }
}
