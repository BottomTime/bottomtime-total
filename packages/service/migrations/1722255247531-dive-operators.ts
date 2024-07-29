import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiveOperators1722255247531 implements MigrationInterface {
  name = 'DiveOperators1722255247531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'dive_operators',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(address, '')), 'B')",
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "dive_operators" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(200) NOT NULL, "description" text, "address" character varying(500), "phone" character varying(20), "email" character varying(100), "website" character varying(200), "gps" geography, "facebook" character varying(100), "twitter" character varying(100), "instagram" character varying(100), "tiktok" character varying(100), "logo" character varying(200), "banner" character varying(200), "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(address, '')), 'B')) STORED NOT NULL, "ownerId" uuid NOT NULL, CONSTRAINT "PK_a5f26d060ecf854fa45f889e285" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_613c0402ee560617077644b416" ON "dive_operators" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5a1c0dafca786e7020621e045" ON "dive_operators" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fbaadf1812b2d0015324c5f049" ON "dive_operators" ("fulltext") `,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."log_entry_media_type_enum" RENAME TO "media_files_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."log_entry_media" RENAME TO "media_files"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."media_files" ALTER COLUMN "logEntryId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."media_files" ADD "diveOperatorId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ALTER COLUMN "fulltext" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD CONSTRAINT "FK_dfeec415bb4336dd1d8aa455c84" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ADD CONSTRAINT "FK_069711fcd0affac0232599db9b6" FOREIGN KEY ("diveOperatorId") REFERENCES "dive_operators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_files" DROP CONSTRAINT "FK_069711fcd0affac0232599db9b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP CONSTRAINT "FK_dfeec415bb4336dd1d8aa455c84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ALTER COLUMN "fulltext" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."media_files" DROP COLUMN "diveOperatorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."media_files" ALTER COLUMN "logEntryId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."media_files" RENAME TO "log_entry_media"`,
    ),
      await queryRunner.query(
        `ALTER TYPE "public"."media_files_type_enum" RENAME TO "log_entry_media_type_enum"`,
      );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fbaadf1812b2d0015324c5f049"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5a1c0dafca786e7020621e045"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_613c0402ee560617077644b416"`,
    );
    await queryRunner.query(`DROP TABLE "dive_operators"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'fulltext',
        'bottomtime_local',
        'public',
        'dive_operators',
      ],
    );
  }
}
