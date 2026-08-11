/**
 * Create-product page.
 *
 * @module pages/admin/products/new
 */
import { AsyncState } from '@/components/common/StateViews';
import { ProductForm } from '@/components/admin/ProductForm';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import type { Brand, CategoryWithParent } from '@/types/models';

/**
 * Renders an empty product form.
 *
 * @returns The page element.
 */
export default function NewProductPage(): JSX.Element {
  const categories = useResource<CategoryWithParent[]>('/api/categories');
  const brands = useResource<Brand[]>('/api/brands');

  return (
    <AdminLayout title="New product" subtitle="The SKU is assigned automatically on save">
      <AsyncState
        isLoading={categories.isLoading || brands.isLoading}
        error={categories.error ?? brands.error}
        isEmpty={(categories.data ?? []).length === 0}
        empty={{
          title: 'Add a category first',
          description: 'Every product needs a category. Create one under Catalogue › Categories.',
        }}
        onRetry={() => {
          void categories.refresh();
          void brands.refresh();
        }}
      >
        <ProductForm product={null} categories={categories.data ?? []} brands={brands.data ?? []} />
      </AsyncState>
    </AdminLayout>
  );
}
