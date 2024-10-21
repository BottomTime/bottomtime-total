import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorVerificationAndSoftDelete1729532986277
  implements MigrationInterface
{
  name = 'OperatorVerificationAndSoftDelete1729532986277';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dive_operators_verificationstatus_enum" AS ENUM('unverified', 'verified', 'pending', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "verificationStatus" "public"."dive_operators_verificationstatus_enum" NOT NULL DEFAULT 'unverified'`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "verificationMessage" character varying(1000)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57ff8f36447c54e8392908e428" ON "dive_operators" ("verificationStatus") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57ff8f36447c54e8392908e428"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "verificationMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "verificationStatus"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."dive_operators_verificationstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "verified" boolean NOT NULL`,
    );
  }
}
