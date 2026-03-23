export const VALID_SORT_FIELDS = ["name", "version", "created_at"] as const;

export const SORTABLE_FIELDS: Record<string, string> = {
  name: "blueprint.name",
  version: "blueprint.version",
  created_at: "blueprint.created_at",
};

export const DEFAULT_SORT_FIELD = "blueprint.created_at";
export const DEFAULT_SORT_ORDER = "DESC" as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
