/**
 * Record-order page.
 *
 * @module pages/admin/orders/new
 */
import { OrderForm } from '@/components/admin/OrderForm';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import type { Admin } from '@/types/models';

/**
 * Renders an empty order form.
 *
 * @returns The page element.
 */
export default function NewOrderPage(): JSX.Element {
  // Staff are optional for assignment, so a failure here must not block the
  // form — an empty list simply means no one can be assigned yet.
  const { data } = useResource<Admin[]>('/api/admins');

  return (
    <AdminLayout title="New order" subtitle="The order number is assigned automatically">
      <OrderForm order={null} staff={data ?? []} />
    </AdminLayout>
  );
}
