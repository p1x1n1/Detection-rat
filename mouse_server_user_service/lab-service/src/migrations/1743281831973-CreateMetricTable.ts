import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertInitialMetrics1743281831973 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const metrics = [
      'Количество пересеченных линий за заданный промежуток времени',
      'Количество пересечений горизонтальных линий',
      'Количество заглядываний в отверстия',
      'Количество стоек',
      'Время нахождения животного в центральном отсеке лабиринта',
      'Время нахождения животного в периферическом отсеке лабиринта',
      'Количество дефекаций',
      'Количество груминга'
    ];

    for (const name of metrics) {
      await queryRunner.query(
        `INSERT INTO "metric" ("metricName")
         SELECT $1
         WHERE NOT EXISTS (
           SELECT 1 FROM "metric" WHERE "metricName" = $1
         )`,
        [name]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "metric" WHERE "metricName" IN (
        'Количество пересеченных линий за заданный промежуток времени',
        'Количество пересечений горизонтальных линий',
        'Количество заглядывай в отверстия',
        'Количество стоек',
        'Время нахождения животного в центральном отсеке лабиринта',
        'Время нахождения животного в периферическом отсеке лабиринта',
        'Количество дефекаций',
        'Количество груминга'
      );
    `);
  }

}
