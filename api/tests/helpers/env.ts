// Sets test DB env vars before any module is imported.
// Jest setupFiles runs this before test files load AppDataSource.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? "blueprints_test";
