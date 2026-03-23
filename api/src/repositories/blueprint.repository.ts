import { AppDataSource } from "../db/data-source";
import { BlueprintEntity } from "../models/blueprint.entity";
import {
  SORTABLE_FIELDS,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
} from "../utils/blueprint.constants";
import { PaginatedResult, ListBlueprintsOptions } from "../models/blueprint.types";
import { CreateBlueprintDto, UpdateBlueprintDto } from "../models/blueprint.schema";

const blueprintRepository = () =>
  AppDataSource.getRepository(BlueprintEntity);

export const createBlueprint = async (
  data: CreateBlueprintDto
): Promise<BlueprintEntity> => {
  const repo = blueprintRepository();
  const blueprint = repo.create(data);
  return repo.save(blueprint);
};

export const findBlueprintById = async (
  id: number
): Promise<BlueprintEntity | null> => {
  return blueprintRepository().findOne({ where: { id } });
};

export const listBlueprints = async (
  options: ListBlueprintsOptions
): Promise<PaginatedResult<BlueprintEntity>> => {
  const { page, pageSize, sortBy, sortOrder = DEFAULT_SORT_ORDER } = options;

  const resolvedSortField = SORTABLE_FIELDS[sortBy ?? ""] ?? DEFAULT_SORT_FIELD;

  const [data, total_items] = await blueprintRepository()
    .createQueryBuilder("blueprint")
    .orderBy(resolvedSortField, sortOrder)
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();

  return {
    data,
    pagination: {
      page,
      page_size: pageSize,
      total_items,
      total_pages: Math.ceil(total_items / pageSize),
    },
  };
};

export const updateBlueprint = async (
  id: number,
  data: UpdateBlueprintDto
): Promise<BlueprintEntity | null> => {
  const repo = blueprintRepository();
  const existing = await repo.findOne({ where: { id } });

  if (!existing) {
    return null;
  }

  repo.merge(existing, data);
  return repo.save(existing);
};

export const deleteBlueprint = async (id: number): Promise<boolean> => {
  const result = await blueprintRepository().delete(id);
  return (result.affected ?? 0) > 0;
};
