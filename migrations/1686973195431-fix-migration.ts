import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMigration1686973195431 implements MigrationInterface {
    name = 'FixMigration1686973195431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209"`);
        await queryRunner.query(`ALTER TABLE "comment" ALTER COLUMN "parent_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209"`);
        await queryRunner.query(`ALTER TABLE "comment" ALTER COLUMN "parent_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_8bd8d0985c0d077c8129fb4a209" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
