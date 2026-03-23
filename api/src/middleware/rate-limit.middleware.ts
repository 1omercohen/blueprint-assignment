// third-party
import rateLimit from "express-rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_MESSAGE = "Too many requests, please try again later";

export const rateLimitMiddleware = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { error: RATE_LIMIT_MESSAGE },
  standardHeaders: true,
  legacyHeaders: false,
});
