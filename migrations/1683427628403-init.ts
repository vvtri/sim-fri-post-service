import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1683427628403 implements MigrationInterface {
    name = 'Init1683427628403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'UNVERIFIED')`);
        await queryRunner.query(`CREATE TABLE "user" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" integer NOT NULL, "status" "public"."user_status_enum" NOT NULL, "device_tokens" text array, "phone_number" character varying(50), "address" character varying(255), "email" character varying(255), "name" character varying(50), "birth_date" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    }

}
