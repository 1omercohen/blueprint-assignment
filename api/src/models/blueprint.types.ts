export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ListBlueprintsOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}
