import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatuses1746622118759 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const statuses = [
            'Создан',
            'В очереди',
            'Участвует в эксперименте',
            'В процессе',
            'Извлечение кадров',
            'Анализ',
            'Генерация результатов',
            'Успешно завершено',
            'Ошибка во время выполнения анализа',
            'Отменено',
            'Частично успешно',
            'Проверено',
            'Неподдерживаемый формат'
        ];

        for (const name of statuses) {
            await queryRunner.query(
                `INSERT INTO "status" ("statusName")
             SELECT CAST($1 AS VARCHAR)
             WHERE NOT EXISTS (
               SELECT 1 FROM "status" WHERE "statusName" = $1
             )`,
                [name]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM status 
            WHERE "statusName" IN (
              'Создан',
              'В очереди',
              'Участвует в эксперименте',
              'В процессе',
              'Извлечение кадров',
              'Анализ',
              'Генерация результатов',
              'Успешно завершено',
              'Ошибка во время выполнения анализа',
              'Отменено',
              'Частично успешно',
              'Проверено',
              'Неподдерживаемый формат'
            );
          `);
    }
}
