// internal
import { BlueprintEntity } from "../models/blueprint.entity";
import { PaginatedResult, ListBlueprintsOptions } from "../models/blueprint.types";
import { CreateBlueprintDto, UpdateBlueprintDto } from "../models/blueprint.schema";
import {
  createBlueprint,
  findBlueprintById,
  listBlueprints,
  updateBlueprint,
  deleteBlueprint,
} from "../repositories/blueprint.repository";

const BLUEPRINT_NOT_FOUND = (id: number): string => `Blueprint with id ${id} not found`;

export const createBlueprintService = async (
  dto: CreateBlueprintDto
): Promise<BlueprintEntity> => createBlueprint(dto);

export const getBlueprintService = async (
  id: number
): Promise<BlueprintEntity> => {
  const blueprint = await findBlueprintById(id);

  if (!blueprint) {
    throw new Error(BLUEPRINT_NOT_FOUND(id));
  }

  return blueprint;
};

export const listBlueprintsService = async (
  options: ListBlueprintsOptions
): Promise<PaginatedResult<BlueprintEntity>> => listBlueprints(options);

export const updateBlueprintService = async (
  id: number,
  dto: UpdateBlueprintDto
): Promise<BlueprintEntity> => {
  const updated = await updateBlueprint(id, dto);

  if (!updated) {
    throw new Error(BLUEPRINT_NOT_FOUND(id));
  }

  return updated;
};

export const deleteBlueprintService = async (id: number): Promise<void> => {
  const deleted = await deleteBlueprint(id);

  if (!deleted) {
    throw new Error(BLUEPRINT_NOT_FOUND(id));
  }
};
