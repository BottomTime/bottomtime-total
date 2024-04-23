import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProfileBirthdate1713803186871 implements MigrationInterface {
  name = 'DropProfileBirthdate1713803186871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birthdate"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "birthdate" character varying(10)`,
    );
  }
}
