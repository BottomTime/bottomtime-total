import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntryExpansion1721418806988 implements MigrationInterface {
  name = 'LogEntryExpansion1721418806988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_media_type_enum" AS ENUM('image', 'video')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entry_media" ("id" uuid NOT NULL, "type" "public"."log_entry_media_type_enum" NOT NULL, "filePath" character varying(512) NOT NULL, "thumbnailPath" character varying(512), "width" integer NOT NULL, "height" integer NOT NULL, "fileSize" integer NOT NULL, "length" double precision, "gps" geography, "caption" character varying(200), "description" character varying(2000), "logEntryId" uuid, CONSTRAINT "PK_4e3e5b07d1eef93073fce42a1be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56d561494d8d28ea419077cc73" ON "log_entry_media" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_samples_depthunit_enum" AS ENUM('m', 'ft')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_samples_temperatureunit_enum" AS ENUM('C', 'F')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entry_samples" ("id" uuid NOT NULL, "timeOffset" double precision NOT NULL, "depth" double precision, "depthUnit" "public"."log_entry_samples_depthunit_enum", "temperature" double precision, "temperatureUnit" "public"."log_entry_samples_temperatureunit_enum", "logEntryId" uuid, CONSTRAINT "PK_0fa97daac3cca511e2bc32e87ec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d3a4269344ad3ba7faa36d3032" ON "log_entry_samples" ("logEntryId", "timeOffset") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_signatures_type_enum" AS ENUM('buddy', 'divemaster', 'instructor')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entry_signatures" ("id" uuid NOT NULL, "signed" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."log_entry_signatures_type_enum" NOT NULL, "certificationNumber" character varying(100), "logEntryId" uuid, "buddyId" uuid, CONSTRAINT "PK_b23159dd7072523e7fd1261006e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "safetyStop" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "averageDepth" double precision`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_weightcorrectness_enum" AS ENUM('good', 'over', 'under')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "weightCorrectness" "public"."log_entries_weightcorrectness_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "airTemperature" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "surfaceTemperature" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "bottomTemperature" double precision`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_temperatureunit_enum" AS ENUM('C', 'F')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "temperatureUnit" "public"."log_entries_temperatureunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "current" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "weather" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "visibility" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "chop" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "tags" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_media" ADD CONSTRAINT "FK_ebed1797e01358e0bb9ebc08648" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" ADD CONSTRAINT "FK_c59fc764d5d1d61fb6158d5a48d" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" ADD CONSTRAINT "FK_76a249169140fb62ee3ada44009" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" ADD CONSTRAINT "FK_45eb78d7919fe286b8959e0d64f" FOREIGN KEY ("buddyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" DROP CONSTRAINT "FK_45eb78d7919fe286b8959e0d64f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" DROP CONSTRAINT "FK_76a249169140fb62ee3ada44009"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" DROP CONSTRAINT "FK_c59fc764d5d1d61fb6158d5a48d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_media" DROP CONSTRAINT "FK_ebed1797e01358e0bb9ebc08648"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "chop"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "visibility"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "weather"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "current"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "temperatureUnit"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entries_temperatureunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "bottomTemperature"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "surfaceTemperature"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "airTemperature"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "weightCorrectness"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entries_weightcorrectness_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "averageDepth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "safetyStop"`,
    );
    await queryRunner.query(`DROP TABLE "log_entry_signatures"`);
    await queryRunner.query(
      `DROP TYPE "public"."log_entry_signatures_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3a4269344ad3ba7faa36d3032"`,
    );
    await queryRunner.query(`DROP TABLE "log_entry_samples"`);
    await queryRunner.query(
      `DROP TYPE "public"."log_entry_samples_temperatureunit_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entry_samples_depthunit_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56d561494d8d28ea419077cc73"`,
    );
    await queryRunner.query(`DROP TABLE "log_entry_media"`);
    await queryRunner.query(`DROP TYPE "public"."log_entry_media_type_enum"`);
  }
}
