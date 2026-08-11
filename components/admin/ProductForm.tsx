/**
 * Product create/edit form.
 *
 * A single component serves both pages: the only difference is the initial
 * values and the endpoint, which keeps the validation and layout identical.
 *
 * @module components/admin/ProductForm
 */
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import {
  FormCheckboxField,
  FormMultiSelectField,
  FormSelectField,
  FormTagsField,
  FormTextField,
  type SelectOption,
} from '@/components/form/fields';
import { FormActions, FormPanel, FormRow } from '@/components/form/FormLayout';
import { ImageUploader } from '@/components/form/ImageUploader';
import { api } from '@/lib/http';
import { invalidate } from '@/hooks/useResource';
import { notifyError, notifySuccess } from '@/lib/toast';
import { PRODUCT_STATUSES, SIZES, type Brand, type CategoryWithParent, type ProductListItem } from '@/types/models';
import { productCreateSchema, type ProductFormValues } from '@/validation/product.schema';

/** Values for a brand-new product. */
const BLANK_PRODUCT: ProductFormValues = {
  name: '',
  description: undefined,
  brand: null,
  category: '',
  colors: [],
  sizes: [],
  images: [],
  price: 0,
  status: 'active',
  isFeatured: false,
};

/** Props for {@link ProductForm}. */
interface ProductFormProps {
  /** The product being edited, or `null` when creating. */
  product: ProductListItem | null;
  categories: readonly CategoryWithParent[];
  brands: readonly Brand[];
}

/**
 * Converts an existing product into editable form values.
 *
 * @param product - The product to edit.
 * @returns Form values matching the validation schema.
 */
function toFormValues(product: ProductListItem): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    brand: product.brand?._id ?? null,
    category: product.category._id,
    colors: product.colors,
    sizes: product.sizes,
    images: product.images,
    price: product.price,
    status: product.status,
    isFeatured: product.isFeatured,
  };
}

/**
 * The product form.
 *
 * @param props - The product under edit and the available taxonomy.
 * @returns The form element.
 */
export function ProductForm({ product, categories, brands }: ProductFormProps): JSX.Element {
  const router = useRouter();
  const isEdit = product !== null;

  // Child categories are shown with their parent so "T-Shirts" is unambiguous
  // when two parents both have one.
  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category._id,
        label: category.parent ? `${category.parent.name} › ${category.name}` : category.name,
      })),
    [categories],
  );

  const brandOptions = useMemo<SelectOption[]>(
    () => brands.map((brand) => ({ value: brand._id, label: brand.name })),
    [brands],
  );

  const sizeOptions = useMemo<SelectOption[]>(
    () => SIZES.map((size) => ({ value: size, label: size })),
    [],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () =>
      PRODUCT_STATUSES.map((status) => ({
        value: status,
        label: status === 'active' ? 'Active — visible to visitors' : 'Inactive — hidden',
      })),
    [],
  );

  async function handleSubmit(
    values: ProductFormValues,
    helpers: FormikHelpers<ProductFormValues>,
  ): Promise<void> {
    try {
      if (isEdit) {
        await api(`/api/products/${product._id}`, { method: 'PUT', body: values });
        notifySuccess('Product updated');
      } else {
        await api('/api/products', { method: 'POST', body: values });
        notifySuccess('Product created — its SKU has been assigned automatically');
      }
      await invalidate('/api/products');
      await router.push('/admin/products');
    } catch (error) {
      notifyError(error, 'Could not save this product.');
      helpers.setSubmitting(false);
    }
  }

  return (
    <Formik
      initialValues={product ? toFormValues(product) : BLANK_PRODUCT}
      validationSchema={productCreateSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form noValidate>
          <FormPanel title="Product details" description="Shown on the product page and in search.">
            <FormTextField name="name" label="Product name" required />
            <FormTextField
              name="description"
              label="Description"
              multiline
              rows={4}
              helperText="Fabric, fit, packing details — anything a retailer would ask."
            />
            <FormRow>
              <FormSelectField
                name="category"
                label="Category"
                options={categoryOptions}
                required
                helperText="Required. Create categories under Catalogue › Categories."
              />
              <FormSelectField
                name="brand"
                label="Brand"
                options={brandOptions}
                allowEmpty
                emptyLabel="No brand"
                helperText="Optional."
              />
            </FormRow>
          </FormPanel>

          <FormPanel title="Variants" description="What sizes and colours you stock.">
            <FormRow>
              <FormMultiSelectField name="sizes" label="Sizes available" options={sizeOptions} required />
              <FormTagsField
                name="colors"
                label="Colours"
                required
                helperText="Type a colour and press Enter. Duplicates are ignored."
              />
            </FormRow>
          </FormPanel>

          <FormPanel title="Images" description="The first image is used as the thumbnail.">
            <ImageUploader
              name="images"
              label="Product images"
              folder="products"
              maxFiles={8}
              helperText="Up to 8 images, 8 MB each. JPG, PNG or WebP."
            />
          </FormPanel>

          <FormPanel
            title="Pricing and visibility"
            description="Discounts are applied automatically from the Discounts page — enter the base price here."
          >
            <FormRow>
              <FormTextField
                name="price"
                label="Price"
                type="number"
                required
                startAdornment={<InputAdornment position="start">₹</InputAdornment>}
              />
              <FormSelectField name="status" label="Status" options={statusOptions} required />
            </FormRow>
            <FormCheckboxField
              name="isFeatured"
              label="Show on the home page as a featured product"
            />
          </FormPanel>

          <FormActions>
            <Button onClick={() => router.push('/admin/products')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );
}
