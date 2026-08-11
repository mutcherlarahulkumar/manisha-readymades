/**
 * Edit-product page.
 *
 * @module pages/admin/products/[id]
 */
import { useRouter } from 'next/router';

import { ProductForm } from '@/components/admin/ProductForm';
import { AsyncState } from '@/components/common/StateViews';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import type { Brand, CategoryWithParent, ProductListItem } from '@/types/models';

/**
 * Loads a product and renders the form pre-filled.
 *
 * @returns The page element.
 */
export default function EditProductPage(): JSX.Element {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  // `router.query` is empty on the first render, so the request is deferred
  // until the id is known.
  const product = useResource<ProductListItem>(id ? `/api/products/${id}` : null);
  const categories = useResource<CategoryWithParent[]>('/api/categories');
  const brands = useResource<Brand[]>('/api/brands');

  return (
    <AdminLayout
      title="Edit product"
      subtitle={product.data ? `${product.data.sku} · ${product.data.name}` : undefined}
    >
      <AsyncState
        isLoading={product.isLoading || categories.isLoading || brands.isLoading || !id}
        error={product.error ?? categories.error ?? brands.error}
        isEmpty={false}
        onRetry={() => void product.refresh()}
      >
        {product.data && (
          <ProductForm
            product={product.data}
            categories={categories.data ?? []}
            brands={brands.data ?? []}
          />
        )}
      </AsyncState>
    </AdminLayout>
  );
}
