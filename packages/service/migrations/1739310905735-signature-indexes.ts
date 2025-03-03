import { MigrationInterface, QueryRunner } from 'typeorm';

export class SignatureIndexes1739310905735 implements MigrationInterface {
  name = 'SignatureIndexes1739310905735';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_9d9cdfd1083ef8e6dfdfe7baec" ON "log_entry_signatures" ("signed") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_989ee3c1294e48163b1c23770c" ON "log_entry_signatures" ("logEntryId", "buddyId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_989ee3c1294e48163b1c23770c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9d9cdfd1083ef8e6dfdfe7baec"`,
    );
  }
}
