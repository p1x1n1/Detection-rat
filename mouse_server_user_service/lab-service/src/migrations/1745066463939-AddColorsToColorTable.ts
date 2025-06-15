import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColorsToColorTable1745066463939 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const colors = [
          'белые, альбиносы',
          'белая',
          'агути',
          'черный',
          'осветленная коричневая',
          'гибридная'
        ];
    
        for (const name of colors) {
          await queryRunner.query(
            `INSERT INTO "color" ("colorName")
             SELECT CAST($1 AS VARCHAR)
             WHERE NOT EXISTS (
               SELECT 1 FROM "color" WHERE "colorName" = $1
             )`,
            [name]
          );
        }
      }
    

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM color 
      WHERE colorName IN (
        'белые, альбиносы',
        'белая',
        'агути',
        'черный',
        'осветленная коричневая',
        'гибридная'
      );
    `);
  }
}
