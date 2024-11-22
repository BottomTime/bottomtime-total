import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationWhitelists1732210455234 implements MigrationInterface {
  name = 'NotificationWhitelists1732210455234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_whitelists_type_enum" AS ENUM('email', 'pushNotification')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_whitelists" ("id" uuid NOT NULL, "type" "public"."notification_whitelists_type_enum" NOT NULL, "whitelist" character varying(255) array NOT NULL DEFAULT '{*}', "userId" uuid, CONSTRAINT "PK_43e75135c3e67065b3bae66630b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_088c59253327fff3affa7dd221" ON "notification_whitelists" ("userId", "type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_whitelists" ADD CONSTRAINT "FK_79b14bd38982064d349e764ac5a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_whitelists" DROP CONSTRAINT "FK_79b14bd38982064d349e764ac5a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_088c59253327fff3affa7dd221"`,
    );
    await queryRunner.query(`DROP TABLE "notification_whitelists"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_whitelists_type_enum"`,
    );
  }
}
