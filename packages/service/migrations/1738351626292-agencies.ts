import { MigrationInterface, QueryRunner } from 'typeorm';

export class Agencies1738351626292 implements MigrationInterface {
  name = 'Agencies1738351626292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d10bff77f069a4f92ec9ab1f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6059f3015a538f7656da969186"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" RENAME COLUMN "agency" TO "agencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" RENAME COLUMN "agency" TO "agencyId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "agencies" ("id" uuid NOT NULL, "ordinal" integer, "name" character varying(200) NOT NULL, "logo" character varying(250) NOT NULL, "website" character varying(250) NOT NULL, CONSTRAINT "PK_8ab1f1f53f56c8255b0d7e68b28" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45d2714a776160d0868300f119" ON "agencies" ("ordinal") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1ea16c73ecef4bab2f61c31c88" ON "agencies" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_professional_affiliations" ("id" uuid NOT NULL, "title" character varying(200) NOT NULL, "identificationNumber" character varying(100) NOT NULL, "startDate" character varying(20), "agencyId" uuid, "userId" uuid, CONSTRAINT "PK_affd613bfadee206235cb40f70e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_149437f30feeb28064f89c73a7" ON "user_professional_affiliations" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" ADD "agencyId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" DROP COLUMN "agencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" ADD "agencyId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" DROP COLUMN "agencyId"`,
    );
    await queryRunner.query(`ALTER TABLE "certifications" ADD "agencyId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_beb56177a6c410d28f64b6198c" ON "user_certifications" ("agencyId", "course") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65ecf745341ccbf984e20909ea" ON "certifications" ("agencyId", "course") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" ADD CONSTRAINT "FK_dccd42f446055a4339f1fb16a09" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" ADD CONSTRAINT "FK_7798874f889281bf7d90182110f" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" ADD CONSTRAINT "FK_225ab26441a705f1f216de32c4b" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_professional_affiliations" ADD CONSTRAINT "FK_6542d68b4cb941da02022217e47" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_professional_affiliations" ADD CONSTRAINT "FK_149437f30feeb28064f89c73a7b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_professional_affiliations" DROP CONSTRAINT "FK_149437f30feeb28064f89c73a7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_professional_affiliations" DROP CONSTRAINT "FK_6542d68b4cb941da02022217e47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" DROP CONSTRAINT "FK_225ab26441a705f1f216de32c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" DROP CONSTRAINT "FK_7798874f889281bf7d90182110f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" DROP CONSTRAINT "FK_dccd42f446055a4339f1fb16a09"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65ecf745341ccbf984e20909ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_beb56177a6c410d28f64b6198c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" DROP COLUMN "agencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certifications" ADD "agencyId" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" DROP COLUMN "agencyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" ADD "agencyId" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entry_signatures" DROP COLUMN "agencyId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_149437f30feeb28064f89c73a7"`,
    );
    await queryRunner.query(`DROP TABLE "user_professional_affiliations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ea16c73ecef4bab2f61c31c88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45d2714a776160d0868300f119"`,
    );
    await queryRunner.query(`DROP TABLE "agencies"`);
    await queryRunner.query(
      `ALTER TABLE "certifications" RENAME COLUMN "agencyId" TO "agency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" RENAME COLUMN "agencyId" TO "agency"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6059f3015a538f7656da969186" ON "certifications" ("course", "agency") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d10bff77f069a4f92ec9ab1f1" ON "user_certifications" ("course", "agency") `,
    );
  }
}
