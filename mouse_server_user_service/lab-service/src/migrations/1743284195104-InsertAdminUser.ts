import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertAdminUser1743284195104 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(`SELECT id FROM "role" WHERE name = 'Админ'`);
    const roleId = result[0]?.id;

    if (!roleId) {
      throw new Error('Роль \"Админ\" не найдена. Убедись, что InsertInitialRole миграция выполнена.');
    }

    await queryRunner.query(`
      INSERT INTO "user" (
        "login", "email", "name", "firstname", "lastname",
        "password", "phone", "isActive", "createdAt", "updatedAt", "roleId"
      )
      SELECT 'admin',
             'admin@example.com',
             'Администратор',
             'Имя',
             'Фамилия',
             '$2b$10$5x6q9TXNV0gVXx5eh9SfsO5eJ6ddkUl/EMOEPDJRJ71CLsG6R2sTy',
             '+79999999999',
             true,
             NOW(),
             NOW(),
             $1
      WHERE NOT EXISTS (
        SELECT 1 FROM "user" WHERE "login" = 'admin'
      );
    `, [roleId]);
  }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "user" WHERE "login" = 'admin'`);
    }

}
