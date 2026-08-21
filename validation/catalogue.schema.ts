/**
 * Wholesale catalogue validation.
 *
 * @module validation/catalogue.schema
 */
import * as yup from 'yup';

import { imageAssetSchema, optionalText } from '@/validation/common';

/** Payload for uploading or replacing the catalogue. */
export const catalogueSchema = yup.object({
  file: imageAssetSchema.required('Upload a catalogue file'),
  label: optionalText('Label', 80),
});

/** Values held by the admin catalogue form. */
export type CatalogueFormValues = yup.InferType<typeof catalogueSchema>;
