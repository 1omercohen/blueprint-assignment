// third-party
import { z } from "zod";

// internal
import { VALID_SORT_FIELDS, DEFAULT_SORT_ORDER, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../utils/blueprint.constants";

export const CreateBlueprintSchema = z.object({
  name: z.string().min(1, "name is required"),
  version: z.string().min(1, "version is required"),
  author: z.string().min(1, "author is required"),
  blueprint_data: z.record(z.string(), z.unknown()),
});

export const UpdateBlueprintSchema = CreateBlueprintSchema.partial();

export const ListBlueprintsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  page_size: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  sort_by: z.enum(VALID_SORT_FIELDS).optional(),
  sort_order: z.enum(["ASC", "DESC"]).default(DEFAULT_SORT_ORDER),
});

export type CreateBlueprintDto = z.infer<typeof CreateBlueprintSchema>;
export type UpdateBlueprintDto = z.infer<typeof UpdateBlueprintSchema>;
export type ListBlueprintsQuery = z.infer<typeof ListBlueprintsQuerySchema>;
