import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUser1683682403593 implements MigrationInterface {
    name = 'UpdateUser1683682403593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."post_reaction_type_enum" AS ENUM('LIKE', 'LOVE', 'ANGRY')`);
        await queryRunner.query(`CREATE TABLE "post_reaction" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "type" "public"."post_reaction_type_enum" NOT NULL, "user_id" integer NOT NULL, "post_id" integer NOT NULL, CONSTRAINT "PK_72c5fe23f6a0f35b8c2ba78945f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."post_audience_type_enum" AS ENUM('ONLY_ME', 'FRIEND', 'PUBLIC')`);
        await queryRunner.query(`CREATE TABLE "post" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "content" character varying(2000) NOT NULL, "audience_type" "public"."post_audience_type_enum" NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_file" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "post_id" integer NOT NULL, "file_id" integer NOT NULL, CONSTRAINT "PK_92d3b60cdcdd57e2ea334c1b26d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "device_tokens"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "birth_date"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_30ae9db858e049c9fcb6f9c2b38" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_860c24b55da4541f8322a2bdced" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_52378a74ae3724bcab44036645b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_file" ADD CONSTRAINT "FK_49d5d1fe834522f5b83c35314f5" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_file" ADD CONSTRAINT "FK_86cf3a3c7c19cf3e1576cc20506" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_file" DROP CONSTRAINT "FK_86cf3a3c7c19cf3e1576cc20506"`);
        await queryRunner.query(`ALTER TABLE "post_file" DROP CONSTRAINT "FK_49d5d1fe834522f5b83c35314f5"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_52378a74ae3724bcab44036645b"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_860c24b55da4541f8322a2bdced"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_30ae9db858e049c9fcb6f9c2b38"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "birth_date" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user" ADD "name" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "address" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "device_tokens" text array`);
        await queryRunner.query(`DROP TABLE "post_file"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TYPE "public"."post_audience_type_enum"`);
        await queryRunner.query(`DROP TABLE "post_reaction"`);
        await queryRunner.query(`DROP TYPE "public"."post_reaction_type_enum"`);
    }

}
