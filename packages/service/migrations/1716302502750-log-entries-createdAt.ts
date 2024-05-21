import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntriesCreatedAt1716302502750 implements MigrationInterface {
  name = 'LogEntriesCreatedAt1716302502750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "updatedAt" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_261d4e40869089b7b0cc3b29b9" ON "users" ("lastLogin") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63e7536b0bc80bd21e7f25dfac" ON "log_entries" ("createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63e7536b0bc80bd21e7f25dfac"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_261d4e40869089b7b0cc3b29b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "createdAt"`,
    );
  }
}
