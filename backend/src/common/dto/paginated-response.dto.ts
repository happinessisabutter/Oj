export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;

  constructor(data: T[], total: number, page: number, pageSize: number) {
    this.data = data;
    this.meta = {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
