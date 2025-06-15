import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusesTriggers1746622208675 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Триггер для video_experiment
        await queryRunner.query(`
          CREATE OR REPLACE FUNCTION set_default_video_status()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW."statusId" IS NULL THEN
              SELECT id INTO NEW."statusId"
              FROM status WHERE "statusName" = 'в ожидании' LIMIT 1;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
          CREATE TRIGGER set_video_status_default
          BEFORE INSERT ON "video_experiment"
          FOR EACH ROW EXECUTE FUNCTION set_default_video_status();
        `);

        // Триггер для experiment
        await queryRunner.query(`
          CREATE OR REPLACE FUNCTION set_default_experiment_status()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW."statusId" IS NULL THEN
              SELECT id INTO NEW."statusId"
              FROM status WHERE "statusName" = 'создан' LIMIT 1;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
          CREATE TRIGGER set_experiment_status_default
          BEFORE INSERT ON "experiment"
          FOR EACH ROW EXECUTE FUNCTION set_default_experiment_status();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS set_video_status_default ON "video_experiment";`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS set_default_video_status();`);

        await queryRunner.query(`DROP TRIGGER IF EXISTS set_experiment_status_default ON "experiment";`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS set_default_experiment_status();`);
    }

}
