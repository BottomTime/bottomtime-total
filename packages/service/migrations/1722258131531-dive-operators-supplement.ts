import { MigrationInterface, QueryRunner } from 'typeorm';

export class Check1722258131531 implements MigrationInterface {
  name = 'Check1722258131531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_files" DROP CONSTRAINT "FK_ebed1797e01358e0bb9ebc08648"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56d561494d8d28ea419077cc73"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4bd557c4c40f21641ba6908b1a" ON "media_files" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ADD CONSTRAINT "FK_f9029f20d70df75fbcfd16d08f8" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_files" DROP CONSTRAINT "FK_f9029f20d70df75fbcfd16d08f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bd557c4c40f21641ba6908b1a"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56d561494d8d28ea419077cc73" ON "media_files" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `ALTER TABLE "media_files" ADD CONSTRAINT "FK_ebed1797e01358e0bb9ebc08648" FOREIGN KEY ("logEntryId") REFERENCES "log_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
