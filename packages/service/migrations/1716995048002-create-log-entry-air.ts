import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLogEntryAir1716995048002 implements MigrationInterface {
  name = 'CreateLogEntryAir1716995048002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_air_material_enum" AS ENUM('al', 'fe')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_air_pressureunit_enum" AS ENUM('bar', 'psi')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entry_air" ("id" uuid NOT NULL, "ordinal" integer NOT NULL, "name" character varying(100) NOT NULL, "material" "public"."log_entry_air_material_enum" NOT NULL, "workingPressure" double precision NOT NULL, "volume" double precision NOT NULL, "count" integer NOT NULL, "startPressure" double precision NOT NULL, "endPressure" double precision NOT NULL, "pressureUnit" "public"."log_entry_air_pressureunit_enum" NOT NULL, "o2Percent" double precision, "hePercent" double precision, "logEntryId" uuid NOT NULL, CONSTRAINT "PK_efcd010486287c9b7d51a71717a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9fc8a8b603478c1bded448aeda" ON "log_entry_air" ("logEntryId", "ordinal") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_air" ADD CONSTRAINT "FK_c81ff8a6d9c2c47df3dd0de08a6" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entry_air" DROP CONSTRAINT "FK_c81ff8a6d9c2c47df3dd0de08a6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9fc8a8b603478c1bded448aeda"`,
    );
    await queryRunner.query(`DROP TABLE "log_entry_air"`);
    await queryRunner.query(
      `DROP TYPE "public"."log_entry_air_pressureunit_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."log_entry_air_material_enum"`);
  }
}
