import "reflect-metadata";
import { DataSource } from "typeorm";
import { BlueprintEntity } from "../models/blueprint.entity";

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = parseInt(process.env.DB_PORT ?? "5432", 10);
const DB_USER = process.env.DB_USER ?? "bluebricks";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "bluebricks";
const DB_NAME = process.env.DB_NAME ?? "blueprints";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: false,
  entities: [BlueprintEntity],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
});
