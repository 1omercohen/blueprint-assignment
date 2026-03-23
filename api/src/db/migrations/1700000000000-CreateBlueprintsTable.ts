import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBlueprintsTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE blueprints (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(255)  NOT NULL,
        version      VARCHAR(50)   NOT NULL,
        author       VARCHAR(255)  NOT NULL,
        blueprint_data JSONB       NOT NULL,
        created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE blueprints`);
  }
}
