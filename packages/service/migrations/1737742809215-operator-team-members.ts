import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorTeamMembers1737742809215 implements MigrationInterface {
  name = 'OperatorTeamMembers1737742809215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dive_operator_team_members" ("id" uuid NOT NULL, "title" character varying(200), "joined" character varying(20), "operatorId" uuid, "teamMemberId" uuid, CONSTRAINT "PK_58878c76afbddeabf1a0202742c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f34ae3cb78fff54be41e3a55d1" ON "dive_operator_team_members" ("operatorId", "teamMemberId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_team_members" ADD CONSTRAINT "FK_752f7c91e7b88c0340d4a028a22" FOREIGN KEY ("operatorId") REFERENCES "dive_operators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_team_members" ADD CONSTRAINT "FK_ef59d40d3169c693e07ed1a4987" FOREIGN KEY ("teamMemberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dive_operator_team_members" DROP CONSTRAINT "FK_ef59d40d3169c693e07ed1a4987"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_operator_team_members" DROP CONSTRAINT "FK_752f7c91e7b88c0340d4a028a22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f34ae3cb78fff54be41e3a55d1"`,
    );
    await queryRunner.query(`DROP TABLE "dive_operator_team_members"`);
  }
}
