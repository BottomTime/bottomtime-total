import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLogEntries1712954608213 implements MigrationInterface {
  name = 'CreateLogEntries1712954608213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_maxdepthunit_enum" AS ENUM('m', 'ft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entries" ("id" uuid NOT NULL, "logNumber" integer, "timestamp" TIMESTAMP NOT NULL, "entryTime" TIMESTAMP NOT NULL, "timezone" text NOT NULL, "bottomTime" integer, "duration" integer, "maxDepth" double precision, "maxDepthUnit" "public"."log_entries_maxdepthunit_enum", "notes" text, "creatorId" uuid, CONSTRAINT "PK_b226cc4051321f12106771581e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2e050f214b4e7195701305e99" ON "log_entries" ("logNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88410904513ed6cfdd598a777b" ON "log_entries" ("timestamp") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_caf2dd336587553277814374982" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_caf2dd336587553277814374982"`,
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
