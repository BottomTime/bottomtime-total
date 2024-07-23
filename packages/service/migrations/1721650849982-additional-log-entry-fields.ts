import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntryDepth1721650849982 implements MigrationInterface {
  name = 'LogEntryDepth1721650849982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" RENAME COLUMN "maxDepthUnit" TO "depthUnit"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."log_entries_maxdepthunit_enum" RENAME TO "log_entries_depthunit_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_trimcorrectness_enum" AS ENUM('good', 'headDown', 'kneesDown')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "trimCorrectness" "public"."log_entries_trimcorrectness_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "current"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "current" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "chop"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "chop" double precision`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_exposuresuit_enum" AS ENUM('drysuit', 'none', 'other', 'rashguard', 'shorty', '3mm', '5mm', '7mm', '9mm')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "exposureSuit" "public"."log_entries_exposuresuit_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "hood" boolean`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "gloves" boolean`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "boots" boolean`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "camera" boolean`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "torch" boolean`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "scooter" boolean`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "safetyStop"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "safetyStop" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "scooter"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "torch"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "camera"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "boots"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "gloves"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "hood"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "exposureSuit"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entries_exposuresuit_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "chop"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "chop" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "current"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "current" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "trimCorrectness"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entries_trimcorrectness_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."log_entries_depthunit_enum" RENAME TO "log_entries_maxdepthunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" RENAME COLUMN "depthUnit" TO "maxDepthUnit"`,
    );
  }
}
