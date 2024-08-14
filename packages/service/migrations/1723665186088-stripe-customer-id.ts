import { MigrationInterface, QueryRunner } from 'typeorm';

export class StripeCustomerId1723665186088 implements MigrationInterface {
  name = 'StripeCustomerId1723665186088';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "stripeCustomerId" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "stripeCustomerId"`,
    );
  }
}
