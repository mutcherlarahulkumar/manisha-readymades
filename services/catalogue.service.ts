/**
 * Wholesale catalogue business logic.
 *
 * @module services/catalogue.service
 */
import { deleteAssets } from '@/lib/cloudinary';
import { serialize } from '@/lib/serialize';
import { Catalogue, CATALOGUE_KEY } from '@/models/Catalogue';
import type { Catalogue as CatalogueJson } from '@/types/models';
import type { CatalogueFormValues } from '@/validation/catalogue.schema';

/**
 * Reads the current catalogue.
 *
 * @returns The catalogue, or `null` when none has been uploaded.
 */
export async function getCatalogue(): Promise<CatalogueJson | null> {
  const doc = await Catalogue.findOne({ singleton: CATALOGUE_KEY }).lean();
  return doc ? serialize<CatalogueJson>(doc) : null;
}

/**
 * Uploads or replaces the catalogue.
 *
 * @param values - The new file and optional label.
 * @returns The stored catalogue.
 *
 * @remarks
 * The previous PDF is removed from Cloudinary once the replacement is safely
 * recorded — never before, so a failed write cannot leave the site pointing at
 * a file that no longer exists. A failed delete only costs a little storage,
 * which is why {@link deleteAssets} swallows its own errors.
 */
export async function saveCatalogue(values: CatalogueFormValues): Promise<CatalogueJson> {
  const previous = await Catalogue.findOne({ singleton: CATALOGUE_KEY }).lean();

  const doc = await Catalogue.findOneAndUpdate(
    { singleton: CATALOGUE_KEY },
    { ...values, singleton: CATALOGUE_KEY },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  const staleId = previous?.file.publicId;
  if (staleId && staleId !== values.file.publicId) {
    await deleteAssets([staleId]);
  }

  return serialize<CatalogueJson>(doc!);
}

/**
 * Removes the catalogue, so the download button stops being offered.
 *
 * @remarks
 * Safe to call when nothing is stored — the storefront treats "no catalogue"
 * and "catalogue removed" identically.
 */
export async function deleteCatalogue(): Promise<void> {
  const existing = await Catalogue.findOneAndDelete({ singleton: CATALOGUE_KEY }).lean();
  if (existing) await deleteAssets([existing.file.publicId]);
}
