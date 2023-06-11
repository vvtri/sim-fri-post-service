import { MigrationInterface, QueryRunner } from "typeorm";

export class ImplComment1686319243800 implements MigrationInterface {
    name = 'ImplComment1686319243800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comment_file" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "file_id" integer NOT NULL, "comment_id" integer NOT NULL, CONSTRAINT "PK_82d253ec0eee2847f7aed08cbf4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comment" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "content" character varying(2000) NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "mpath" character varying DEFAULT '', "parent_id" integer, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."comment_reaction_type_enum" AS ENUM('LIKE', 'LOVE', 'ANGRY')`);
        await queryRunner.query(`CREATE TABLE "comment_reaction" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "id" SERIAL NOT NULL, "type" "public"."comment_reaction_type_enum" NOT NULL, "comment_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_87f27d282c06eb61b1e0cde2d24" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "comment_file" ADD CONSTRAINT "FK_b506527d3062e5c936ceab0b05e" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_file" ADD CONSTRAINT "FK_33a1d6fde54e3b93e6dbd91c787" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_962582f04d3f639e33f43c54bbc" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_f8e54702e8418719a786c60fcd2" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_f8e54702e8418719a786c60fcd2"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_962582f04d3f639e33f43c54bbc"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93"`);
        await queryRunner.query(`ALTER TABLE "comment_file" DROP CONSTRAINT "FK_33a1d6fde54e3b93e6dbd91c787"`);
        await queryRunner.query(`ALTER TABLE "comment_file" DROP CONSTRAINT "FK_b506527d3062e5c936ceab0b05e"`);
        await queryRunner.query(`DROP TABLE "comment_reaction"`);
        await queryRunner.query(`DROP TYPE "public"."comment_reaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP TABLE "comment_file"`);
    }

}
