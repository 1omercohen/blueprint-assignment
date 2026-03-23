// standard
import "dotenv/config";
import { Server } from "http";

// internal
import createApp from "./app";
import { AppDataSource } from "./db/data-source";
import { logger } from "./utils/logger";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const shutdown = (server: Server, signal: string): void => {
  logger.info({ signal }, "Shutdown signal received, draining connections");

  server.close(async () => {
    try {
      await AppDataSource.destroy();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  });
};

const startServer = async (): Promise<void> => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const app = createApp();
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "Blueprint Manager API running");
  });

  process.on("SIGTERM", () => shutdown(server, "SIGTERM"));
  process.on("SIGINT", () => shutdown(server, "SIGINT"));
};

startServer().catch((error: Error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});
