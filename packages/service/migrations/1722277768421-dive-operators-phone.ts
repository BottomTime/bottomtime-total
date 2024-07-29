import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiveOperatorsPhone1722277768421 implements MigrationInterface {
  name = 'DiveOperatorsPhone1722277768421';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dive_operators" DROP COLUMN "phone"`);
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "phone" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dive_operators" DROP COLUMN "phone"`);
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "phone" character varying(20)`,
    );
  }
}
