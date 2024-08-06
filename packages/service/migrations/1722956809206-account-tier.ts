import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountTier1722956809206 implements MigrationInterface {
  name = 'AccountTier1722956809206';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "accountTier" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "accountTier"`);
  }
}
