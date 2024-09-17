import { MigrationInterface, QueryRunner } from 'typeorm';

export class InvalidTokens1726593840993 implements MigrationInterface {
  name = 'InvalidTokens1726593840993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invalid_tokens" ("token" character varying(255) NOT NULL, "invalidated" TIMESTAMP NOT NULL, CONSTRAINT "PK_25bcd94a90772243ce41429b93d" PRIMARY KEY ("token"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4920065a5800c75f0a839d4934" ON "invalid_tokens" ("invalidated") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4920065a5800c75f0a839d4934"`,
    );
    await queryRunner.query(`DROP TABLE "invalid_tokens"`);
  }
}
