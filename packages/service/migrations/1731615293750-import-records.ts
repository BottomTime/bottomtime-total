import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImportRecords1731615293750 implements MigrationInterface {
  name = 'ImportRecords1731615293750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_533ae4d9300afc45a81938696aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" RENAME COLUMN "resumeToken" TO "finalized"`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entry_import_records" ("id" uuid NOT NULL, "data" jsonb NOT NULL, "importId" uuid, CONSTRAINT "PK_ffef34b7f55d7ef112a741e0fc0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce041b97797926659ea5a60dc0" ON "log_entry_import_records" ("importId") `,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "importId"`);
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "finalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD "finalized" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_import_records" ADD CONSTRAINT "FK_ce041b97797926659ea5a60dc04" FOREIGN KEY ("importId") REFERENCES "log_entry_imports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entry_import_records" DROP CONSTRAINT "FK_ce041b97797926659ea5a60dc04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "finalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD "finalized" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "importId" uuid`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce041b97797926659ea5a60dc0"`,
    );
    await queryRunner.query(`DROP TABLE "log_entry_import_records"`);
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" RENAME COLUMN "finalized" TO "resumeToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_533ae4d9300afc45a81938696aa" FOREIGN KEY ("importId") REFERENCES "log_entry_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
