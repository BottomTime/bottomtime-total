import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1709558381645 implements MigrationInterface {
  name = 'Init1709558381645';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tanks_material_enum" AS ENUM('al', 'fe')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tanks" ("id" uuid NOT NULL, "name" character varying(100) NOT NULL, "material" "public"."tanks_material_enum" NOT NULL, "workingPressure" double precision NOT NULL, "volume" double precision NOT NULL, "userId" uuid, CONSTRAINT "PK_6f4aa0dd55c110e1ca7cac7b504" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2716674d19e19131d08deb4b00" ON "tanks" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_certifications" ("id" uuid NOT NULL, "agency" character varying(100) NOT NULL, "course" character varying(200) NOT NULL, "date" TIMESTAMP NOT NULL, "userId" uuid, CONSTRAINT "PK_9951122e9d864429886105c6448" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d10bff77f069a4f92ec9ab1f1" ON "user_certifications" ("agency", "course") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_oauth" ("id" uuid NOT NULL, "provider" character varying NOT NULL, "providerId" character varying NOT NULL, "userId" uuid, CONSTRAINT "PK_95d512d160789656ed4f21af994" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b7a9b856329b6e832f5ffb017d" ON "user_oauth" ("provider", "providerId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_depth_enum" AS ENUM('m', 'ft')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_pressureunit_enum" AS ENUM('bar', 'psi')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_profilevisibility_enum" AS ENUM('private', 'friends', 'public')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_temperatureunit_enum" AS ENUM('C', 'F')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_weightunit_enum" AS ENUM('kg', 'lbs')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "avatar" character varying(150) NOT NULL, "bio" character varying(1000) NOT NULL, "birthdate" character varying(10) NOT NULL, "customData" json NOT NULL, "depth" "public"."users_depth_enum" NOT NULL DEFAULT 'm', "email" character varying(50) NOT NULL, "emailLowered" character varying(50) NOT NULL, "emailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying(50) NOT NULL, "emailVerificationTokenExpiration" TIMESTAMP NOT NULL, "experienceLevel" character varying(50) NOT NULL, "isLockedOut" boolean NOT NULL DEFAULT false, "lastLogin" TIMESTAMP NOT NULL, "lastPasswordChange" TIMESTAMP NOT NULL, "location" character varying(50) NOT NULL, "memberSince" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "passwordHash" character varying NOT NULL, "passwordResetToken" character varying NOT NULL, "passwordResetTokenExpiration" TIMESTAMP NOT NULL, "pressureUnit" "public"."users_pressureunit_enum" NOT NULL DEFAULT 'bar', "profileVisibility" "public"."users_profilevisibility_enum" NOT NULL DEFAULT 'friends', "temperatureUnit" "public"."users_temperatureunit_enum" NOT NULL DEFAULT 'C', "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "startedDiving" character varying(10) NOT NULL, "username" character varying(50) NOT NULL, "usernameLowered" character varying(50) NOT NULL, "weightUnit" "public"."users_weightunit_enum" NOT NULL DEFAULT 'kg', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_03580a0758829653051f731522" ON "users" ("emailLowered") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f571c869c630983fd3d1ba7b8" ON "users" ("isLockedOut") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d4985288a6d5f238b2dfa195a2" ON "users" ("memberSince") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3bb366d1cc723386bb537d1951" ON "users" ("usernameLowered") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dive_sites_depthunit_enum" AS ENUM('m', 'ft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "dive_sites" ("id" uuid NOT NULL, "createdOn" TIMESTAMP NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(200) NOT NULL, "description" character varying(2000) NOT NULL, "depth" double precision NOT NULL, "depthUnit" "public"."dive_sites_depthunit_enum" NOT NULL, "location" character varying(200) NOT NULL, "directions" character varying(500) NOT NULL, "gps" geometry NOT NULL, "freeToDive" boolean NOT NULL, "shoreAccess" boolean NOT NULL, "creatorId" uuid, CONSTRAINT "PK_0a067f7ec8dac38250a17c76a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_beda1a34f66b41bc95d759cd7c" ON "dive_sites" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c3fe5bb0dd3f7d7731b220c64" ON "dive_sites" USING GiST ("gps") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a1a9dfe5c0a869ba0f76030ad" ON "dive_sites" ("freeToDive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9eab21148cf62d85c44ebbab4" ON "dive_sites" ("shoreAccess") `,
    );
    await queryRunner.query(
      `CREATE TABLE "friend_requests" ("id" uuid NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "expires" TIMESTAMP NOT NULL, "accepted" boolean NOT NULL, "reason" character varying(500) NOT NULL, "fromId" uuid, "toId" uuid, CONSTRAINT "PK_3827ba86ce64ecb4b90c92eeea6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0611a39fee13104e56c4d63f9a" ON "friend_requests" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b9caea4e9a2183babc3a807c6" ON "friend_requests" ("expires") `,
    );
    await queryRunner.query(
      `CREATE TABLE "dive_site_reviews" ("id" uuid NOT NULL, "createdOn" TIMESTAMP NOT NULL DEFAULT now(), "updatedOn" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(200) NOT NULL, "rating" double precision NOT NULL, "difficulty" double precision NOT NULL, "comments" character varying(1000) NOT NULL, "creatorId" uuid, "siteId" uuid, CONSTRAINT "PK_1698470d7b7644b0f0ebb4d14a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f91b251bfbf2300f6a01877e0a" ON "dive_site_reviews" ("createdOn") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6e8363710abb3520fa68ed3163" ON "dive_site_reviews" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_397d256bc427e2d8073f519386" ON "dive_site_reviews" ("rating") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86f9f0ce42116a405999b132f8" ON "dive_site_reviews" ("difficulty") `,
    );
    await queryRunner.query(
      `CREATE TABLE "friendships" ("id" uuid NOT NULL, "friendsSince" TIMESTAMP NOT NULL, "userId" uuid, "friendId" uuid, CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd702c3c85f038336e96446739" ON "friendships" ("friendsSince") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_79319c79ccb0d109db66e5faaf" ON "friendships" ("userId", "friendId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "certifications" ("id" uuid NOT NULL, "agency" character varying(100) NOT NULL, "course" character varying(200) NOT NULL, CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6059f3015a538f7656da969186" ON "certifications" ("agency", "course") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tanks" ADD CONSTRAINT "FK_25b6106d92d7cf01df09c5ccc10" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" ADD CONSTRAINT "FK_404d2600e3ff3739cc63feac3cc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth" ADD CONSTRAINT "FK_5ed0c676645727b4be0f3c27abf" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" ADD CONSTRAINT "FK_3681025ed319874bfb8907ab659" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_bb210d9d07053874661c450d7f4" FOREIGN KEY ("fromId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_b6893fbcb759cd455c63c03da5a" FOREIGN KEY ("toId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_7e54d76e17186fe677b826e1e3c" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" ADD CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f" FOREIGN KEY ("siteId") REFERENCES "dive_sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_721d9e1784e4eb781d7666fa7ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_d54199dd09cec12dda4c4a05cd7" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "friendships" DROP CONSTRAINT "FK_d54199dd09cec12dda4c4a05cd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" DROP CONSTRAINT "FK_721d9e1784e4eb781d7666fa7ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_a927bd1320cbb280ec7486baf8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_site_reviews" DROP CONSTRAINT "FK_7e54d76e17186fe677b826e1e3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_b6893fbcb759cd455c63c03da5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_bb210d9d07053874661c450d7f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dive_sites" DROP CONSTRAINT "FK_3681025ed319874bfb8907ab659"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth" DROP CONSTRAINT "FK_5ed0c676645727b4be0f3c27abf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_certifications" DROP CONSTRAINT "FK_404d2600e3ff3739cc63feac3cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tanks" DROP CONSTRAINT "FK_25b6106d92d7cf01df09c5ccc10"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6059f3015a538f7656da969186"`,
    );
    await queryRunner.query(`DROP TABLE "certifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79319c79ccb0d109db66e5faaf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd702c3c85f038336e96446739"`,
    );
    await queryRunner.query(`DROP TABLE "friendships"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86f9f0ce42116a405999b132f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_397d256bc427e2d8073f519386"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6e8363710abb3520fa68ed3163"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f91b251bfbf2300f6a01877e0a"`,
    );
    await queryRunner.query(`DROP TABLE "dive_site_reviews"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b9caea4e9a2183babc3a807c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0611a39fee13104e56c4d63f9a"`,
    );
    await queryRunner.query(`DROP TABLE "friend_requests"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d9eab21148cf62d85c44ebbab4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a1a9dfe5c0a869ba0f76030ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c3fe5bb0dd3f7d7731b220c64"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_beda1a34f66b41bc95d759cd7c"`,
    );
    await queryRunner.query(`DROP TABLE "dive_sites"`);
    await queryRunner.query(`DROP TYPE "public"."dive_sites_depthunit_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3bb366d1cc723386bb537d1951"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d4985288a6d5f238b2dfa195a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f571c869c630983fd3d1ba7b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03580a0758829653051f731522"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_weightunit_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_temperatureunit_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."users_profilevisibility_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_pressureunit_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_depth_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7a9b856329b6e832f5ffb017d"`,
    );
    await queryRunner.query(`DROP TABLE "user_oauth"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d10bff77f069a4f92ec9ab1f1"`,
    );
    await queryRunner.query(`DROP TABLE "user_certifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2716674d19e19131d08deb4b00"`,
    );
    await queryRunner.query(`DROP TABLE "tanks"`);
    await queryRunner.query(`DROP TYPE "public"."tanks_material_enum"`);
  }
}
