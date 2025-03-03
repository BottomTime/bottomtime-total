import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntryFulltext1738852754056 implements MigrationInterface {
  name = 'LogEntryFulltext1738852754056';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "fulltext" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(notes, '') || ' ' || tags), 'A')) STORED`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'bottomtime_local',
        'public',
        'log_entries',
        'GENERATED_COLUMN',
        'fulltext',
        "setweight(to_tsvector('english', coalesce(notes, '') || ' ' || tags), 'A')",
      ],
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d853b4bf3069330797a57c5c39" ON "log_entries" ("fulltext") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d853b4bf3069330797a57c5c39"`,
    );
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'fulltext',
        'bottomtime_local',
        'public',
        'log_entries',
      ],
    );
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "fulltext"`);
  }
}
