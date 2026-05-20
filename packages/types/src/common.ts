export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  /** When set, filters rows where `status` equals this boolean. */
  status?: boolean;
};
