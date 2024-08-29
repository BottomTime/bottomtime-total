import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexStripeId1724771133315 implements MigrationInterface {
  name = 'IndexStripeId1724771133315';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ab9126a074980674ba95d4cd35" ON "users" ("stripeCustomerId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab9126a074980674ba95d4cd35"`,
    );
  }
}
