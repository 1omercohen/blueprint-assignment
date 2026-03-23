// third-party
import { Router, Request, Response, NextFunction } from "express";

// internal
import {
  createBlueprintService,
  getBlueprintService,
  listBlueprintsService,
  updateBlueprintService,
  deleteBlueprintService,
} from "../services/blueprint.service";
import {
  CreateBlueprintSchema,
  UpdateBlueprintSchema,
  ListBlueprintsQuerySchema,
  CreateBlueprintDto,
  UpdateBlueprintDto,
  ListBlueprintsQuery,
} from "../models/blueprint.schema";
import { validate } from "../middleware/validate.middleware";
import { parseIdParam } from "../utils/request.parser";

const router = Router();

router.post(
  "/",
  validate(CreateBlueprintSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const blueprint = await createBlueprintService(req.body as CreateBlueprintDto);
      res.status(201).json(blueprint);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/",
  validate(ListBlueprintsQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListBlueprintsQuery;
      const result = await listBlueprintsService({
        page: query.page,
        pageSize: query.page_size,
        sortBy: query.sort_by,
        sortOrder: query.sort_order,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseIdParam(req.params.id);
      const blueprint = await getBlueprintService(id);
      res.status(200).json(blueprint);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  validate(UpdateBlueprintSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseIdParam(req.params.id);
      const blueprint = await updateBlueprintService(id, req.body as UpdateBlueprintDto);
      res.status(200).json(blueprint);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseIdParam(req.params.id);
      await deleteBlueprintService(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
