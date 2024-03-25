import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProfileVisibility1711140574054
  implements MigrationInterface
{
  name = 'RemoveProfileVisibility1711140574054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profileVisibility"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."users_profilevisibility_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_profilevisibility_enum" AS ENUM('private', 'friends', 'public')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profileVisibility" "public"."users_profilevisibility_enum" DEFAULT 'friends'`,
    );
  }
}
