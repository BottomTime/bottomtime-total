import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogImports1731419932158 implements MigrationInterface {
  name = 'LogImports1731419932158';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "log_entry_imports" ("id" uuid NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "device" character varying(200), "deviceId" character varying(200), "bookmark" character varying(200), "resumeToken" character varying(100), "ownerId" uuid, CONSTRAINT "PK_a0b2d9ae1016f827c869b6b0694" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfd8d1af32141a12b912e2fac9" ON "log_entry_imports" ("date") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" DROP COLUMN "temperatureUnit"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entry_samples_temperatureunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" DROP COLUMN "depthUnit"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."log_entry_samples_depthunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" ADD "gps" geography(Point,4326)`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "importId" uuid`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3a4269344ad3ba7faa36d3032"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" DROP COLUMN "timeOffset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" ADD "timeOffset" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ALTER COLUMN "gps" TYPE geography(Point,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ALTER COLUMN "gps" TYPE geography(Point,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ALTER COLUMN "gps" TYPE geography(Point,4326)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d3a4269344ad3ba7faa36d3032" ON "log_entry_samples" ("logEntryId", "timeOffset") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" ADD CONSTRAINT "FK_cfe00f59597809f7b2a21265c7c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_533ae4d9300afc45a81938696aa" FOREIGN KEY ("importId") REFERENCES "log_entry_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_533ae4d9300afc45a81938696aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_imports" DROP CONSTRAINT "FK_cfe00f59597809f7b2a21265c7c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3a4269344ad3ba7faa36d3032"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ALTER COLUMN "gps" TYPE geography(Geometry,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ALTER COLUMN "gps" TYPE geography(Geometry,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ALTER COLUMN "gps" TYPE geography(Geometry,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" DROP COLUMN "timeOffset"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" ADD "timeOffset" double precision NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d3a4269344ad3ba7faa36d3032" ON "log_entry_samples" ("logEntryId", "timeOffset") `,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "importId"`);
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" DROP COLUMN "gps"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_samples_depthunit_enum" AS ENUM('m', 'ft')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" ADD "depthUnit" "public"."log_entry_samples_depthunit_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entry_samples_temperatureunit_enum" AS ENUM('C', 'F')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_samples" ADD "temperatureUnit" "public"."log_entry_samples_temperatureunit_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfd8d1af32141a12b912e2fac9"`,
    );
    await queryRunner.query(`DROP TABLE "log_entry_imports"`);
  }
}
