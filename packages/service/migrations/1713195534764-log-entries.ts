import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntries1713195534764 implements MigrationInterface {
  name = 'LogEntries1713195534764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_maxdepthunit_enum" AS ENUM('m', 'ft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entries" ("id" uuid NOT NULL, "logNumber" integer, "timestamp" TIMESTAMP NOT NULL, "entryTime" character varying(20) NOT NULL, "timezone" text NOT NULL, "bottomTime" double precision, "duration" double precision NOT NULL, "maxDepth" double precision, "maxDepthUnit" "public"."log_entries_maxdepthunit_enum", "notes" text, "ownerId" uuid, "siteId" uuid, CONSTRAINT "PK_b226cc4051321f12106771581e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2e050f214b4e7195701305e99" ON "log_entries" ("logNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88410904513ed6cfdd598a777b" ON "log_entries" ("timestamp") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_05b47d6d3a72a3055c70920e3dd" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_0239facc9ceb98e75477500c0d7" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_0239facc9ceb98e75477500c0d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_05b47d6d3a72a3055c70920e3dd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88410904513ed6cfdd598a777b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2e050f214b4e7195701305e99"`,
    );
    await queryRunner.query(`DROP TABLE "log_entries"`);
    await queryRunner.query(
      `DROP TYPE "public"."log_entries_maxdepthunit_enum"`,
    );
  }
}
