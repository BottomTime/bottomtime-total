import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImportMetadata1731945880115 implements MigrationInterface {
  name = 'ImportMetadata1731945880115';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "deviceName" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ADD "deviceId" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "deviceId"`);
    await queryRunner.query(
      `ALTER TABLE "log_entries" DROP COLUMN "deviceName"`,
    );
  }
}
