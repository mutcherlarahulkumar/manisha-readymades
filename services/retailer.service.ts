/**
 * Retailer application business logic.
 *
 * @module services/retailer.service
 */
import type { FilterQuery } from 'mongoose';

import { ApiError } from '@/lib/api/ApiError';
import { serialize } from '@/lib/serialize';
import {
  RetailerApplication,
  type RetailerApplicationDocument,
} from '@/models/RetailerApplication';
import type { Paginated } from '@/types/api';
import type { RetailerApplication as RetailerApplicationJson } from '@/types/models';
import type {
  RetailerApplicationValues,
  RetailerQuery,
  RetailerReviewValues,
} from '@/validation/retailer.schema';

/**
 * Records a new application from the storefront.
 *
 * @param values - Validated form values.
 * @returns The stored application.
 *
 * @remarks
 * Deliberately permissive about duplicates. A shop that applies twice is a shop
 * that is keen, and rejecting the second attempt with an error would read as
 * the site being broken; the admin queue shows both and one gets closed.
 */
export async function createRetailerApplication(
  values: RetailerApplicationValues,
): Promise<RetailerApplicationJson> {
  const created = await RetailerApplication.create(values);
  return serialize<RetailerApplicationJson>(created.toObject());
}

/**
 * Lists applications for the admin queue, newest first.
 *
 * @param query - Validated pagination and status filter.
 * @returns A page of applications.
 */
export async function listRetailerApplications(
  query: RetailerQuery,
): Promise<Paginated<RetailerApplicationJson>> {
  const filter: FilterQuery<RetailerApplicationDocument> = {};
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;
  const [docs, total] = await Promise.all([
    RetailerApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
    RetailerApplication.countDocuments(filter),
  ]);

  return {
    items: serialize<RetailerApplicationJson[]>(docs),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

/**
 * Updates an application's review state.
 *
 * @param id - The application's ObjectId.
 * @param values - The new status and any internal note.
 * @returns The updated application.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function reviewRetailerApplication(
  id: string,
  values: RetailerReviewValues,
): Promise<RetailerApplicationJson> {
  const doc = await RetailerApplication.findByIdAndUpdate(id, values, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) throw ApiError.notFound('Retailer application');
  return serialize<RetailerApplicationJson>(doc);
}

/**
 * Counts applications that nobody has looked at yet.
 *
 * @returns The number of applications still in `new`.
 */
export async function countNewRetailerApplications(): Promise<number> {
  return RetailerApplication.countDocuments({ status: 'new' });
}
