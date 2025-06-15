import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertInitialRole1743284119134 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles = ['Админ', 'Сотрудник лаборатории'];

    for (const roleName of roles) {
      await queryRunner.query(
        `INSERT INTO "role" ("name")
         SELECT CAST($1 AS VARCHAR)
         WHERE NOT EXISTS (
           SELECT 1 FROM "role" WHERE "name" = CAST($1 AS VARCHAR)
         )`,
        [roleName]
      );
    }
  }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          DELETE FROM "role" WHERE "name" IN ('Админ', 'Сотрудник лаборатории');
        `);
    }

}
