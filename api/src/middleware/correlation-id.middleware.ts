// third-party
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const CORRELATION_ID_HEADER = "x-correlation-id";

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers[CORRELATION_ID_HEADER] as string) ?? randomUUID();
  res.locals.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
};
