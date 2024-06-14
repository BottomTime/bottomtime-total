import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogEntryWeights1718300850201 implements MigrationInterface {
  name = 'LogEntryWeights1718300850201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_0239facc9ceb98e75477500c0d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "weight" double precision`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_weightunit_enum" AS ENUM('kg', 'lbs')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "weightUnit" "public"."log_entries_weightunit_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_0239facc9ceb98e75477500c0d7" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP CONSTRAINT "FK_0239facc9ceb98e75477500c0d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "weightUnit"`,
    );
    await queryRunner.query(`DROP TYPE "public"."log_entries_weightunit_enum"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "weight"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD CONSTRAINT "FK_0239facc9ceb98e75477500c0d7" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
