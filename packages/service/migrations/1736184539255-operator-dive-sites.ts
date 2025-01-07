import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorDiveSites1736184539255 implements MigrationInterface {
  name = 'OperatorDiveSites1736184539255';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "FK_b1a2dd0154e6999ebe00ad0b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "FK_26d890a44207bc7d98ff907fb26"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26d890a44207bc7d98ff907fb2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1a2dd0154e6999ebe00ad0b2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "PK_fe49fad7b4c1a29a2f6b3b98d14"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "PK_b1a2dd0154e6999ebe00ad0b2e2" PRIMARY KEY ("diveSitesId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP COLUMN "diveOperatorsId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "PK_b1a2dd0154e6999ebe00ad0b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP COLUMN "diveSitesId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD "id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "PK_684a53b054171b78ce528140b69" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD "operatorId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD "siteId" uuid`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e584279366f560fe5121fc3b86" ON "dive_operator_sites" ("operatorId", "siteId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "FK_7ff41f5ef43281a614861da5d31" FOREIGN KEY ("operatorId") REFERENCES "dive_operators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "FK_7e47318de042bb5d3d5a926e3fc" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "FK_7e47318de042bb5d3d5a926e3fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "FK_7ff41f5ef43281a614861da5d31"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e584279366f560fe5121fc3b86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP COLUMN "siteId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP COLUMN "operatorId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "PK_684a53b054171b78ce528140b69"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP COLUMN "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD "diveSitesId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "PK_b1a2dd0154e6999ebe00ad0b2e2" PRIMARY KEY ("diveSitesId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD "diveOperatorsId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" DROP CONSTRAINT "PK_b1a2dd0154e6999ebe00ad0b2e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "PK_fe49fad7b4c1a29a2f6b3b98d14" PRIMARY KEY ("diveOperatorsId", "diveSitesId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1a2dd0154e6999ebe00ad0b2e" ON "dive_operator_sites" ("diveSitesId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26d890a44207bc7d98ff907fb2" ON "dive_operator_sites" ("diveOperatorsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "FK_26d890a44207bc7d98ff907fb26" FOREIGN KEY ("diveOperatorsId") REFERENCES "dive_operators"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_sites" ADD CONSTRAINT "FK_b1a2dd0154e6999ebe00ad0b2e2" FOREIGN KEY ("diveSitesId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
