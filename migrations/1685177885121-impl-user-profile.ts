import { MigrationInterface, QueryRunner } from "typeorm";

export class ImplUserProfile1685177885121 implements MigrationInterface {
    name = 'ImplUserProfile1685177885121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_profile_relationship_status_enum" AS ENUM('SINGLE', 'IN_RELATIONSHIP', 'MARRIED', 'SECRET')`);
        await queryRunner.query(`CREATE TABLE "user_profile" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" integer NOT NULL, "address" character varying, "name" character varying, "birth_date" TIMESTAMP WITH TIME ZONE, "workplace" character varying, "school" character varying, "hometown" character varying, "relationship_status" "public"."user_profile_relationship_status_enum", "avatar_id" integer, "user_id" integer NOT NULL, CONSTRAINT "REL_3c011f4eefd39da06c16ace49a" UNIQUE ("avatar_id"), CONSTRAINT "REL_eee360f3bff24af1b689076520" UNIQUE ("user_id"), CONSTRAINT "PK_f44d0cd18cfd80b0fed7806c3b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_3c011f4eefd39da06c16ace49a2" FOREIGN KEY ("avatar_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD CONSTRAINT "FK_eee360f3bff24af1b6890765201" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_eee360f3bff24af1b6890765201"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP CONSTRAINT "FK_3c011f4eefd39da06c16ace49a2"`);
        await queryRunner.query(`DROP TABLE "user_profile"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_relationship_status_enum"`);
    }

}
