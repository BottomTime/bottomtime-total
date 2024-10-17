import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorsActiveColumn1729184488602 implements MigrationInterface {
  name = 'OperatorsActiveColumn1729184488602';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "active" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "active"`,
    );
  }
}
