// internal
import { BlueprintEntity } from "../models/blueprint.entity";
import { PaginatedResult, ListBlueprintsOptions } from "../models/blueprint.types";
import { CreateBlueprintDto, UpdateBlueprintDto } from "../models/blueprint.schema";
import { NotFoundError } from "../utils/errors";
import { BLUEPRINT_RESOURCE } from "../utils/blueprint.constants";
import {
  createBlueprint,
  findBlueprintById,
  listBlueprints,
  updateBlueprint,
  deleteBlueprint,
} from "../repositories/blueprint.repository";


export const createBlueprintService = async (
  dto: CreateBlueprintDto
): Promise<BlueprintEntity> => createBlueprint(dto);

export const getBlueprintService = async (
  id: number
): Promise<BlueprintEntity> => {
  const blueprint = await findBlueprintById(id);

  if (!blueprint) {
    throw new NotFoundError(BLUEPRINT_RESOURCE, id);
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
    throw new NotFoundError(BLUEPRINT_RESOURCE, id);
  }

  return updated;
};

export const deleteBlueprintService = async (id: number): Promise<void> => {
  const deleted = await deleteBlueprint(id);

  if (!deleted) {
    throw new NotFoundError(BLUEPRINT_RESOURCE, id);
  }
};
