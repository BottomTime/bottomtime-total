import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationsCta1733422955657 implements MigrationInterface {
  name = 'NotificationsCta1733422955657';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "callsToAction" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "callsToAction"`,
    );
  }
}
