// Sets test env vars before any module is imported.
// Jest setupFiles runs this before test files load AppDataSource or logger.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? "blueprints_test";
process.env.LOG_LEVEL = "silent";
