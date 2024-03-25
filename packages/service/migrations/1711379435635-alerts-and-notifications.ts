import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlertsAndNotifications1711379435635 implements MigrationInterface {
  name = 'AlertsAndNotifications1711379435635';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL, "icon" character varying(100) NOT NULL, "title" character varying(200) NOT NULL, "message" character varying(2000) NOT NULL, "active" TIMESTAMP, "expires" TIMESTAMP, "dismissed" boolean NOT NULL, "recipientId" uuid NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f19ca23ca4d6700ff293e27e5" ON "notifications" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6d0e41a1e448674bfd05b1102" ON "notifications" ("expires") `,
    );
    await queryRunner.query(
      `CREATE TABLE "alerts" ("id" uuid NOT NULL, "icon" character varying(100) NOT NULL, "title" character varying(200) NOT NULL, "message" text NOT NULL, "active" TIMESTAMP, "expires" TIMESTAMP, CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3b5748040fb851426315e9373" ON "alerts" ("active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0f35ae5e43ea52ac6983f683f" ON "alerts" ("expires") `,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_dismissals" ("alertsId" uuid NOT NULL, "usersId" uuid NOT NULL, CONSTRAINT "PK_dcfa392a935fc0291a12db7cfc7" PRIMARY KEY ("alertsId", "usersId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cafb7290d4d52233f6b49692a4" ON "alert_dismissals" ("alertsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9c0c413970482609b0580c505b" ON "alert_dismissals" ("usersId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_dismissals" ADD CONSTRAINT "FK_cafb7290d4d52233f6b49692a4d" FOREIGN KEY ("alertsId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_dismissals" ADD CONSTRAINT "FK_9c0c413970482609b0580c505b0" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_dismissals" DROP CONSTRAINT "FK_9c0c413970482609b0580c505b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_dismissals" DROP CONSTRAINT "FK_cafb7290d4d52233f6b49692a4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9c0c413970482609b0580c505b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cafb7290d4d52233f6b49692a4"`,
    );
    await queryRunner.query(`DROP TABLE "alert_dismissals"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b0f35ae5e43ea52ac6983f683f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3b5748040fb851426315e9373"`,
    );
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6d0e41a1e448674bfd05b1102"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f19ca23ca4d6700ff293e27e5"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
