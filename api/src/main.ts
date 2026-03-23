// standard
import "dotenv/config";

// internal
import createApp from "./app";
import { AppDataSource } from "./db/data-source";
import { logger } from "./utils/logger";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const startServer = async (): Promise<void> => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const app = createApp();

  app.listen(PORT, () => {
    logger.info({ port: PORT }, "Blueprint Manager API running");
  });
};

startServer().catch((error: Error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});
