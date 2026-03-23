// third-party
import pinoHttp from "pino-http";
import { Response } from "express";

// internal
import { logger } from "../utils/logger";

export const httpLoggerMiddleware = pinoHttp({
  logger,
  // Use the correlation ID set by correlationIdMiddleware as the request ID
  // so every log line is traceable back to a single request.
  genReqId: (_req, res) => (res as Response).locals.correlationId as string,
});
