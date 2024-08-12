import { MigrationInterface, QueryRunner } from 'typeorm';

export class XpAndBadges1723475196803 implements MigrationInterface {
  name = 'XpAndBadges1723475196803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "badges" ("key" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(1000) NOT NULL, "xpValue" integer NOT NULL, CONSTRAINT "PK_48f63aae4227e0bc83aaee64286" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9c91fc9c4a4ae01712baad1e9f" ON "badges" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_badges" ("usersId" uuid NOT NULL, "badgesKey" character varying(100) NOT NULL, CONSTRAINT "PK_47fad75405de0b72488b0466e31" PRIMARY KEY ("usersId", "badgesKey"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8c4bd6b4eb3c6b73155717e5b" ON "user_badges" ("usersId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc9a4db12b7a6fa11906af7cd4" ON "user_badges" ("badgesKey") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "xp" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" ADD CONSTRAINT "FK_e8c4bd6b4eb3c6b73155717e5b3" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" ADD CONSTRAINT "FK_bc9a4db12b7a6fa11906af7cd47" FOREIGN KEY ("badgesKey") REFERENCES "badges"("key") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_bc9a4db12b7a6fa11906af7cd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_e8c4bd6b4eb3c6b73155717e5b3"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "xp"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bc9a4db12b7a6fa11906af7cd4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8c4bd6b4eb3c6b73155717e5b"`,
    );
    await queryRunner.query(`DROP TABLE "user_badges"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9c91fc9c4a4ae01712baad1e9f"`,
    );
    await queryRunner.query(`DROP TABLE "badges"`);
  }
}
