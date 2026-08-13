/**
 * Admin dashboard home: the numbers the owner checks first, with links into the
 * lists that need attention.
 *
 * @module pages/admin/index
 */
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import SellIcon from '@mui/icons-material/Sell';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Button from '@mui/material/Button';

import { Section } from '@/components/common/PageContainer';
import { AsyncState } from '@/components/common/StateViews';
import { StatCard, StatGrid } from '@/components/admin/StatCard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import type { AnalyticsSummary } from '@/services/analytics.service';
import type { OrderStatusCounts } from '@/services/order.service';

/**
 * The dashboard landing page.
 *
 * @returns The dashboard.
 */
export default function AdminDashboardPage(): JSX.Element {
  const orders = useResource<OrderStatusCounts>('/api/orders/stats');
  const analytics = useResource<AnalyticsSummary>('/api/analytics/summary?days=30');

  const isLoading = orders.isLoading || analytics.isLoading;
  const error = orders.error ?? analytics.error;

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Orders and catalogue at a glance"
      action={
        <Button variant="contained" href="/admin/orders/new">
          New order
        </Button>
      }
    >
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={false}
        onRetry={() => {
          void orders.refresh();
          void analytics.refresh();
        }}
      >
        <Section density="compact" title="Order tracking" subtitle="Every order currently in the system.">
          <StatGrid columns={6}>
            <StatCard
              label="Pending"
              value={orders.data?.pending ?? 0}
              color="warning"
              icon={<PendingActionsIcon />}
              href="/admin/orders?statuses=pending"
            />
            <StatCard
              label="Processing"
              value={orders.data?.processing ?? 0}
              color="info"
              icon={<ReceiptIcon />}
              href="/admin/orders?statuses=processing"
            />
            <StatCard
              label="Packing"
              value={orders.data?.packing ?? 0}
              color="secondary"
              icon={<InventoryIcon />}
              href="/admin/orders?statuses=packing"
            />
            <StatCard
              label="Dispatched"
              value={orders.data?.dispatched ?? 0}
              color="primary"
              icon={<LocalShippingIcon />}
              href="/admin/orders?statuses=dispatched"
            />
            <StatCard
              label="Completed"
              value={orders.data?.completed ?? 0}
              color="success"
              icon={<TaskAltIcon />}
              href="/admin/orders?statuses=completed"
            />
            <StatCard
              label="Cancelled"
              value={orders.data?.cancelled ?? 0}
              color="error"
              icon={<ReceiptIcon />}
              href="/admin/orders?statuses=cancelled"
            />
          </StatGrid>
        </Section>

        <Section density="compact" title="Catalogue" subtitle="What visitors can currently see.">
          <StatGrid>
            <StatCard
              label="Active products"
              value={analytics.data?.catalogue.activeProducts ?? 0}
              hint={`${analytics.data?.catalogue.inactiveProducts ?? 0} hidden`}
              icon={<InventoryIcon />}
              href="/admin/products"
            />
            <StatCard
              label="Categories"
              value={analytics.data?.catalogue.totalCategories ?? 0}
              icon={<CategoryIcon />}
              color="info"
              href="/admin/categories"
            />
            <StatCard
              label="Brands"
              value={analytics.data?.catalogue.totalBrands ?? 0}
              icon={<SellIcon />}
              color="secondary"
              href="/admin/brands"
            />
            <StatCard
              label="Reviews awaiting approval"
              value={analytics.data?.catalogue.pendingReviews ?? 0}
              icon={<RateReviewIcon />}
              color="warning"
              href="/admin/reviews?status=pending"
            />
          </StatGrid>
        </Section>

        <Section density="compact" title="Visitor interest" subtitle="Last 30 days.">
          <StatGrid columns={3}>
            <StatCard label="Product views" value={analytics.data?.engagement.views ?? 0} icon={<InventoryIcon />} />
            <StatCard
              label="WhatsApp enquiries"
              value={analytics.data?.engagement.whatsappClicks ?? 0}
              color="success"
              icon={<TaskAltIcon />}
            />
            <StatCard
              label="Enquiry rate"
              value={`${analytics.data?.engagement.conversionRate ?? 0}%`}
              hint="Enquiries per product view"
              color="secondary"
              icon={<RateReviewIcon />}
            />
          </StatGrid>
        </Section>
      </AsyncState>
    </AdminLayout>
  );
}
