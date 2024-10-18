import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorsActiveColumn1729184488602 implements MigrationInterface {
  name = 'OperatorsActiveColumn1729184488602';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_62a7c6ab360036cda554213cb9" ON "dive_operators" ("active") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_62a7c6ab360036cda554213cb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "active"`,
    );
  }
}
