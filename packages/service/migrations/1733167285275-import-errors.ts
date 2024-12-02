import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImportErrors1733167285275 implements MigrationInterface {
  name = 'ImportErrors1733167285275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD "error" character varying(500)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bffa677c9a8f23d54a554dce1c" ON "log_entry_imports" ("deviceId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bffa677c9a8f23d54a554dce1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP COLUMN "error"`,
    );
  }
}
