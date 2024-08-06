import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFeatures1722534149021 implements MigrationInterface {
  name = 'RemoveFeatures1722534149021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bcc3a344ae156a9fba128e1cb4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0cc5c687428b94489ce1edc3c5"`,
    );
    await queryRunner.query(`DROP TABLE "features"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "features" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "key" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(2000), "enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0cc5c687428b94489ce1edc3c5" ON "features" ("key") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcc3a344ae156a9fba128e1cb4" ON "features" ("name") `,
    );
  }
}
