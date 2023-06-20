import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileType1686908128975 implements MigrationInterface {
    name = 'AddFileType1686908128975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209"`);
        await queryRunner.query(`ALTER TABLE "comment" ALTER COLUMN "parent_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."file_file_type_enum" RENAME TO "file_file_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."file_file_type_enum" AS ENUM('png', 'jpg', 'jpeg', 'pdf', 'mp3', 'mp4', 'wav', 'xlsx', 'xls', 'csv', 'unknown')`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "file_type" TYPE "public"."file_file_type_enum" USING "file_type"::"text"::"public"."file_file_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."file_file_type_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ff41e8827bb335bce320a9bacf" ON "comment_reaction" ("comment_id", "user_id") WHERE deleted_at is null`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff41e8827bb335bce320a9bacf"`);
        await queryRunner.query(`CREATE TYPE "public"."file_file_type_enum_old" AS ENUM('png', 'jpg', 'jpeg', 'pdf', 'mp3', 'mp4', 'wav', 'xlsx', 'xls', 'csv')`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "file_type" TYPE "public"."file_file_type_enum_old" USING "file_type"::"text"::"public"."file_file_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."file_file_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."file_file_type_enum_old" RENAME TO "file_file_type_enum"`);
        await queryRunner.query(`ALTER TABLE "comment" ALTER COLUMN "parent_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
