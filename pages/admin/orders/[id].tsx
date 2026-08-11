/**
 * Edit-order page.
 *
 * @module pages/admin/orders/[id]
 */
import { useRouter } from 'next/router';

import { OrderForm } from '@/components/admin/OrderForm';
import { AsyncState } from '@/components/common/StateViews';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import type { Admin, OrderWithAssignee } from '@/types/models';

/**
 * Loads an order and renders the form pre-filled.
 *
 * @returns The page element.
 */
export default function EditOrderPage(): JSX.Element {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  const order = useResource<OrderWithAssignee>(id ? `/api/orders/${id}` : null);
  const staff = useResource<Admin[]>('/api/admins');

  return (
    <AdminLayout
      title="Edit order"
      subtitle={order.data ? `${order.data.orderNo} · ${order.data.customerName}` : undefined}
    >
      <AsyncState
        isLoading={order.isLoading || !id}
        error={order.error}
        isEmpty={false}
        onRetry={() => void order.refresh()}
      >
        {order.data && <OrderForm order={order.data} staff={staff.data ?? []} />}
      </AsyncState>
    </AdminLayout>
  );
}
