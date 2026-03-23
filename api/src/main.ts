// standard
import "dotenv/config";

// internal
import createApp from "./app";
import { AppDataSource } from "./db/data-source";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

const startServer = async (): Promise<void> => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Blueprint Manager API running on port ${PORT}`);
  });
};

startServer().catch((error: Error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
