import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImportFinalized1731440045864 implements MigrationInterface {
  name = 'ImportFinalized1731440045864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_533ae4d9300afc45a81938696aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" RENAME COLUMN "resumeToken" TO "finalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "finalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD "finalized" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_533ae4d9300afc45a81938696a" ON "log_entries" ("importId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_533ae4d9300afc45a81938696aa" FOREIGN KEY ("importId") REFERENCES "log_entry_imports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_533ae4d9300afc45a81938696aa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_533ae4d9300afc45a81938696a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "finalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD "finalized" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" RENAME COLUMN "finalized" TO "resumeToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_533ae4d9300afc45a81938696aa" FOREIGN KEY ("importId") REFERENCES "log_entry_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
