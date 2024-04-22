import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogBookSharing1713803072848 implements MigrationInterface {
  name = 'LogBookSharing1713803072848';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_logbooksharing_enum" AS ENUM('public', 'private', 'friends')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "logBookSharing" "public"."users_logbooksharing_enum" NOT NULL DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "depthUnit" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "pressureUnit" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "temperatureUnit" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "weightUnit" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "weightUnit" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "temperatureUnit" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "pressureUnit" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "depthUnit" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "logBookSharing"`);
    await queryRunner.query(`DROP TYPE "public"."users_logbooksharing_enum"`);
  }
}
