import type { FilterQuery, Model } from "mongoose";
import type { PaginationMeta } from "./apiResponse.js";

export type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export function normalizeListQuery(query: ListQuery): Required<ListQuery> {
  return {
    page: Math.max(1, query.page ?? 1),
    limit: Math.min(1000, Math.max(1, query.limit ?? 1000)),
    search: query.search?.trim() ?? "",
  };
}

export async function findPaginated<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  sort: Record<string, 1 | -1>,
  query: ListQuery,
): Promise<{ data: Array<Record<string, unknown>>; meta: PaginationMeta }> {
  const { page, limit } = normalizeListQuery(query);
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    model.countDocuments(filter),
  ]);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
