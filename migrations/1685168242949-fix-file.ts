import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFile1685168242949 implements MigrationInterface {
    name = 'FixFile1685168242949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_file" DROP CONSTRAINT "FK_86cf3a3c7c19cf3e1576cc20506"`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "file_id_seq"`);
        await queryRunner.query(`ALTER TABLE "post_file" ADD CONSTRAINT "FK_86cf3a3c7c19cf3e1576cc20506" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_file" DROP CONSTRAINT "FK_86cf3a3c7c19cf3e1576cc20506"`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "file_id_seq" OWNED BY "file"."id"`);
        await queryRunner.query(`ALTER TABLE "file" ALTER COLUMN "id" SET DEFAULT nextval('"file_id_seq"')`);
        await queryRunner.query(`ALTER TABLE "post_file" ADD CONSTRAINT "FK_86cf3a3c7c19cf3e1576cc20506" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
