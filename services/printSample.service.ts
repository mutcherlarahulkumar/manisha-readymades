/**
 * Custom printing sample business logic.
 *
 * @module services/printSample.service
 */
import { ApiError } from '@/lib/api/ApiError';
import { deleteAssets } from '@/lib/cloudinary';
import { serialize } from '@/lib/serialize';
import { PrintSample } from '@/models/PrintSample';
import type { PrintSample as PrintSampleJson } from '@/types/models';
import type { PrintSampleFormValues } from '@/validation/printSample.schema';

/**
 * Lists printing samples in display order.
 *
 * @param options.activeOnly - Restrict to visible samples (storefront).
 * @returns The matching samples.
 */
export async function listPrintSamples(
  options: { activeOnly?: boolean } = {},
): Promise<PrintSampleJson[]> {
  const filter = options.activeOnly ? { isActive: true } : {};
  const docs = await PrintSample.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return serialize<PrintSampleJson[]>(docs);
}

/**
 * Creates a printing sample.
 *
 * @param values - Validated form values.
 * @returns The created sample.
 */
export async function createPrintSample(
  values: PrintSampleFormValues,
): Promise<PrintSampleJson> {
  const created = await PrintSample.create(values);
  return serialize<PrintSampleJson>(created.toObject());
}

/**
 * Updates a printing sample.
 *
 * @param id - The sample's ObjectId.
 * @param values - Validated form values.
 * @returns The updated sample.
 * @throws {ApiError} 404 when it does not exist.
 *
 * @remarks
 * A replaced photograph is removed from Cloudinary only after the new one is
 * recorded, so a failed write can never leave the page pointing at a file that
 * has already been deleted.
 */
export async function updatePrintSample(
  id: string,
  values: PrintSampleFormValues,
): Promise<PrintSampleJson> {
  const previous = await PrintSample.findById(id).lean();
  if (!previous) throw ApiError.notFound('Printing sample');

  const doc = await PrintSample.findByIdAndUpdate(id, values, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) throw ApiError.notFound('Printing sample');

  if (previous.image.publicId !== values.image.publicId) {
    await deleteAssets([previous.image.publicId]);
  }

  return serialize<PrintSampleJson>(doc);
}

/**
 * Deletes a printing sample and its photograph.
 *
 * @param id - The sample's ObjectId.
 * @throws {ApiError} 404 when it does not exist.
 */
export async function deletePrintSample(id: string): Promise<void> {
  const doc = await PrintSample.findByIdAndDelete(id).lean();
  if (!doc) throw ApiError.notFound('Printing sample');
  await deleteAssets([doc.image.publicId]);
}
