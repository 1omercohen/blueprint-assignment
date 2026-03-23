// third-party
import { Request, Response, NextFunction } from "express";

const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_NOT_FOUND = 404;

const NOT_FOUND_KEYWORDS = ["not found"] as const;

const isNotFoundError = (message: string): boolean =>
  NOT_FOUND_KEYWORDS.some((keyword) => message.toLowerCase().includes(keyword));

const resolveStatusCode = (message: string): number =>
  isNotFoundError(message) ? HTTP_NOT_FOUND : HTTP_INTERNAL_SERVER_ERROR;

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = resolveStatusCode(error.message);

  res.status(statusCode).json({
    error: error.message,
  });
};
