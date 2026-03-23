// standard
import "reflect-metadata";

// third-party
import express, { Application } from "express";
import swaggerUi from "swagger-ui-express";

// internal
import blueprintRoutes from "./routes/blueprint.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware";
import { correlationIdMiddleware } from "./middleware/correlation-id.middleware";
import { swaggerDocument } from "./docs/swagger";

const API_PREFIX = "/blueprints";
const SWAGGER_PREFIX = "/api-docs";

const createApp = (): Application => {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json());
  app.use(SWAGGER_PREFIX, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use(API_PREFIX, blueprintRoutes);
  app.use(errorMiddleware);

  return app;
};

export default createApp;
