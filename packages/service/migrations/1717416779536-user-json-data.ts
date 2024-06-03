import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserJsonData1717416779536 implements MigrationInterface {
  name = 'UserJsonData1717416779536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_json_data_entity" ("id" uuid NOT NULL, "key" character varying(200) NOT NULL, "value" json NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_651dc8c12afd97e6630adb433e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a8e24208af165bb3c6612b309e" ON "user_json_data_entity" ("userId", "key") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_json_data_entity" ADD CONSTRAINT "FK_530ef982703cb502a19185a2a68" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_json_data_entity" DROP CONSTRAINT "FK_530ef982703cb502a19185a2a68"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8e24208af165bb3c6612b309e"`,
    );
    await queryRunner.query(`DROP TABLE "user_json_data_entity"`);
  }
}
