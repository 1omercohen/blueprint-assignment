// third-party
import { Request, Response, NextFunction } from "express";

// internal
import { NotFoundError, ValidationError } from "../utils/errors";

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

const ERROR_STATUS_MAP = new Map<Function, number>([
  [NotFoundError, HTTP_NOT_FOUND],
  [ValidationError, HTTP_BAD_REQUEST],
]);

const resolveStatusCode = (error: Error): number =>
  ERROR_STATUS_MAP.get(error.constructor) ?? HTTP_INTERNAL_SERVER_ERROR;

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = resolveStatusCode(error);

  res.status(statusCode).json({
    error: error.message,
  });
};
