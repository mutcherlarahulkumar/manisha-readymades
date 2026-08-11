/**
 * Internal order-management business logic.
 *
 * Every function here is admin-only; there is no public order endpoint.
 *
 * @module services/order.service
 */
import type { FilterQuery } from 'mongoose';

import { ApiError } from '@/lib/api/ApiError';
import { serialize } from '@/lib/serialize';
import { Admin } from '@/models/Admin';
import { Order, type OrderDocument } from '@/models/Order';
import type { Paginated } from '@/types/api';
import { ORDER_STATUSES, type OrderStatus, type Order as OrderJson, type OrderWithAssignee } from '@/types/models';
import type { OrderFormValues, OrderQuery } from '@/validation/order.schema';

/** Count of orders in each lifecycle stage, for the tracking dashboard. */
export type OrderStatusCounts = Record<OrderStatus, number> & { total: number };

/**
 * Builds the Mongo filter for an order search.
 *
 * @param query - Validated query parameters.
 * @returns A Mongoose filter document.
 */
function buildFilter(query: OrderQuery): FilterQuery<OrderDocument> {
  const filter: FilterQuery<OrderDocument> = {};

  if (query.search) {
    const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(safe, 'i');
    filter.$or = [
      { customerName: pattern },
      { orderNo: pattern },
      { city: pattern },
      { remarks: pattern },
    ];
  }

  if (query.phone) {
    // A phone search should match either number the admin recorded.
    const digits = query.phone.replace(/\D/g, '').slice(-10);
    const pattern = new RegExp(`${digits}$`);
    filter.$and = [{ $or: [{ phone: pattern }, { whatsapp: pattern }] }];
  }

  if (query.city) filter.city = new RegExp(`^${query.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  if (query.statuses.length > 0) filter.status = { $in: query.statuses };
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  if (query.dateFrom || query.dateTo) {
    filter.orderDate = {};
    if (query.dateFrom) filter.orderDate.$gte = query.dateFrom;
    if (query.dateTo) filter.orderDate.$lte = endOfDay(query.dateTo);
  }

  return filter;
}

/**
 * Lists orders with search, filtering and pagination.
 *
 * @param query - Validated query parameters.
 * @returns A page of orders with assignees populated.
 */
export async function listOrders(query: OrderQuery): Promise<Paginated<OrderWithAssignee>> {
  const filter = buildFilter(query);
  const skip = (query.page - 1) * query.limit;
  const sort = { orderDate: query.sort === 'oldest' ? 1 : -1, createdAt: -1 } as const;

  const [docs, total] = await Promise.all([
    Order.find(filter).populate('assignedTo', 'name').sort(sort).skip(skip).limit(query.limit).lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: serialize<OrderWithAssignee[]>(docs),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

/**
 * Returns the number of orders in each status, plus the overall total.
 *
 * @returns Counts keyed by status, with every status present even at zero.
 */
export async function getOrderStatusCounts(): Promise<OrderStatusCounts> {
  const rows = await Order.aggregate<{ _id: OrderStatus; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<
    OrderStatus,
    number
  >;
  let total = 0;
  for (const row of rows) {
    counts[row._id] = row.count;
    total += row.count;
  }

  return { ...counts, total };
}

/**
 * Fetches one order by id.
 *
 * @param id - The order's ObjectId.
 * @returns The order with its assignee populated.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function getOrder(id: string): Promise<OrderWithAssignee> {
  const doc = await Order.findById(id).populate('assignedTo', 'name').lean();
  if (!doc) throw ApiError.notFound('Order');
  return serialize<OrderWithAssignee>(doc);
}

/**
 * Creates an order, assigning the next sequential order number.
 *
 * @param values - Validated form values.
 * @returns The created order.
 * @throws {ApiError} 400 when the assignee does not exist.
 */
export async function createOrder(values: OrderFormValues): Promise<OrderJson> {
  await assertAssigneeExists(values.assignedTo);
  const created = await Order.create(values);
  return serialize<OrderJson>(created.toObject());
}

/**
 * Updates an order. The order number is immutable.
 *
 * @param id - The order's ObjectId.
 * @param values - Validated form values.
 * @returns The updated order.
 * @throws {ApiError} 404 when missing, 400 when the assignee does not exist.
 */
export async function updateOrder(id: string, values: OrderFormValues): Promise<OrderJson> {
  await assertAssigneeExists(values.assignedTo);
  const doc = await Order.findById(id);
  if (!doc) throw ApiError.notFound('Order');

  doc.set(values);
  await doc.save();
  return serialize<OrderJson>(doc.toObject());
}

/**
 * Moves an order to a new status without touching any other field.
 *
 * @param id - The order's ObjectId.
 * @param status - The target status.
 * @returns The updated order.
 * @throws {ApiError} 404 when the order does not exist.
 */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderJson> {
  const doc = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
  if (!doc) throw ApiError.notFound('Order');
  return serialize<OrderJson>(doc);
}

/**
 * Deletes an order.
 *
 * @param id - The order's ObjectId.
 * @returns The public ids of its attachments, for Cloudinary cleanup.
 * @throws {ApiError} 404 when the order does not exist.
 */
export async function deleteOrder(id: string): Promise<{ publicIds: string[] }> {
  const doc = await Order.findByIdAndDelete(id).lean<OrderDocument | null>();
  if (!doc) throw ApiError.notFound('Order');
  return { publicIds: doc.attachments.map((attachment) => attachment.publicId) };
}

/**
 * Verifies that an optional assignee refers to an existing admin.
 *
 * @param assignedTo - Admin id, or `null` when unassigned.
 * @throws {ApiError} 400 when the admin does not exist.
 */
async function assertAssigneeExists(assignedTo: string | null): Promise<void> {
  if (!assignedTo) return;
  const exists = await Admin.exists({ _id: assignedTo });
  if (!exists) throw ApiError.badRequest('Selected staff member no longer exists');
}

/**
 * Extends a date to the last millisecond of its day, so an inclusive
 * "to" filter covers the whole day the admin selected.
 *
 * @param date - The upper-bound date.
 * @returns A new date at 23:59:59.999 on the same day.
 */
function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}
