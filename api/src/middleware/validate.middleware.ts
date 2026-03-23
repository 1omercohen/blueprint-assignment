// third-party
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type RequestSource = "body" | "query";

const formatZodError = (error: ZodError): Record<string, string[]> =>
  error.flatten().fieldErrors as Record<string, string[]>;

export const validate =
  (schema: ZodSchema, source: RequestSource = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
      return;
    }

    req[source] = result.data;
    next();
  };
