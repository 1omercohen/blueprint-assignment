import "reflect-metadata";
import { AppDataSource } from "../../src/db/data-source";

export const initTestDb = async (): Promise<void> => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
};

export const closeTestDb = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};

export const truncateBlueprints = async (): Promise<void> => {
  await AppDataSource.query(
    "TRUNCATE TABLE blueprints RESTART IDENTITY CASCADE"
  );
};
