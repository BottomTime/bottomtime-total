import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiveOperatorSites1728507851481 implements MigrationInterface {
  name = 'DiveOperatorSites1728507851481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dive_operator_sites" ("diveOperatorsId" uuid NOT NULL, "diveSitesId" uuid NOT NULL, CONSTRAINT "PK_fe49fad7b4c1a29a2f6b3b98d14" PRIMARY KEY ("diveOperatorsId", "diveSitesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26d890a44207bc7d98ff907fb2" ON "dive_operator_sites" ("diveOperatorsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1a2dd0154e6999ebe00ad0b2e" ON "dive_operator_sites" ("diveSitesId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "FK_26d890a44207bc7d98ff907fb26" FOREIGN KEY ("diveOperatorsId") REFERENCES "dive_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "FK_b1a2dd0154e6999ebe00ad0b2e2" FOREIGN KEY ("diveSitesId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "FK_b1a2dd0154e6999ebe00ad0b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "FK_26d890a44207bc7d98ff907fb26"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1a2dd0154e6999ebe00ad0b2e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26d890a44207bc7d98ff907fb2"`,
    );
    await queryRunner.query(`DROP TABLE "dive_operator_sites"`);
  }
}
