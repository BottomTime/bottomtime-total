import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImportTimestamps1733237462150 implements MigrationInterface {
  name = 'ImportTimestamps1733237462150';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entry_import_records" ADD "timestamp" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "error"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entry_imports" ADD "error" text`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2ca75b4e7eba60a8130b1c8638" ON "log_entry_import_records" ("importId", "timestamp") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ca75b4e7eba60a8130b1c8638"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD "error" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_import_records" DROP COLUMN "timestamp"`,
    );
  }
}
