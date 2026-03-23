// third-party
import { Router, Request, Response } from "express";

// internal
import { AppDataSource } from "../db/data-source";

const healthRouter = Router();

healthRouter.get("/health", async (_req: Request, res: Response) => {
  try {
    await AppDataSource.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", db: "error" });
  }
});

export default healthRouter;
