import { MigrationInterface, QueryRunner } from 'typeorm';

export class OauthUniqueIndex1715866301895 implements MigrationInterface {
  name = 'OauthUniqueIndex1715866301895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7cbb408528cc0490712e220c88" ON "user_oauth" ("provider", "userId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7cbb408528cc0490712e220c88"`,
    );
  }
}
