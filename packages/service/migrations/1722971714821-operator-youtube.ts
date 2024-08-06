import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorYoutube1722971714821 implements MigrationInterface {
  name = 'OperatorYoutube1722971714821';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" ADD "youtube" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operators" DROP COLUMN "youtube"`,
    );
  }
}
