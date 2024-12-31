import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntrytime1734547471963 implements MigrationInterface {
  name = 'LogEntrytime1734547471963';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88410904513ed6cfdd598a777b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "entryTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" RENAME COLUMN "timestamp" TO "entryTime"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5fcf2fa5803c07db37d48f072a" ON "log_entries" ("ownerId", "entryTime") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5fcf2fa5803c07db37d48f072a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" RENAME COLUMN "entryTime" TO "timestamp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "entryTime" character varying(20) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88410904513ed6cfdd598a777b" ON "log_entries" ("timestamp") `,
    );
  }
}
