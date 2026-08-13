/**
 * Analytics dashboard: catalogue composition and visitor engagement.
 *
 * @module pages/admin/analytics
 */
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import { StatCard, StatGrid } from '@/components/admin/StatCard';
import { Section } from '@/components/common/PageContainer';
import { AsyncState, EmptyState } from '@/components/common/StateViews';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { AnalyticsSummary, RankedProduct } from '@/services/analytics.service';
import { formatCurrency, formatDate } from '@/utils/format';

/** Reporting windows offered. */
const WINDOWS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
] as const;

/**
 * Renders a ranked product table, or an empty state when nothing was recorded.
 *
 * @param props.title - Table heading.
 * @param props.rows - Ranked products.
 * @param props.metric - Column header for the count.
 * @returns The table element.
 */
function RankedTable({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: readonly RankedProduct[];
  metric: string;
}): JSX.Element {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={`No ${title.toLowerCase()} yet`}
        description="Data appears once visitors start browsing the storefront."
      />
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>SKU</TableCell>
            <TableCell>Product</TableCell>
            <TableCell align="right">{metric}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell sx={{ fontFamily: 'monospace' }}>{row.sku}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{row.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * The analytics screen.
 *
 * @returns The page element.
 */
export default function AdminAnalyticsPage(): JSX.Element {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, error, refresh } = useResource<AnalyticsSummary>(
    `/api/analytics/summary?days=${days}`,
  );

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Catalogue health and what visitors are looking at"
      action={
        <TextField
          select
          size="small"
          label="Period"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          sx={{ minWidth: 160 }}
        >
          {WINDOWS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      }
    >
      <AsyncState isLoading={isLoading} error={error} isEmpty={false} onRetry={() => void refresh()}>
        {data && (
          <>
            <Section density="compact" title="Catalogue">
              <StatGrid>
                <StatCard label="Total products" value={data.catalogue.totalProducts} />
                <StatCard label="Active" value={data.catalogue.activeProducts} color="success" />
                <StatCard label="Inactive" value={data.catalogue.inactiveProducts} color="warning" />
                <StatCard
                  label="Average price"
                  value={formatCurrency(data.catalogue.averagePrice)}
                  color="info"
                />
              </StatGrid>
            </Section>

            <Section density="compact" title="Engagement" subtitle={WINDOWS.find((w) => w.value === days)?.label}>
              <StatGrid columns={3}>
                <StatCard label="Product views" value={data.engagement.views} />
                <StatCard
                  label="WhatsApp enquiries"
                  value={data.engagement.whatsappClicks}
                  color="success"
                />
                <StatCard
                  label="Enquiry rate"
                  value={`${data.engagement.conversionRate}%`}
                  hint="Enquiries per view"
                  color="secondary"
                />
              </StatGrid>

              {data.dailyViews.length > 0 && (
                <Paper variant="outlined" sx={{ p: INNER_SPACING, mt: OUTER_SPACING }}>
                  <Typography variant="subtitle2" sx={{ mb: INNER_SPACING }}>
                    Product views per day
                  </Typography>
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <LineChart
                      height={280}
                      xAxis={[
                        {
                          scaleType: 'point',
                          data: data.dailyViews.map((point) => formatDate(point.date)),
                        },
                      ]}
                      series={[{ data: data.dailyViews.map((point) => point.count), label: 'Views' }]}
                    />
                  </Box>
                </Paper>
              )}
            </Section>

            <Section density="compact" title="Most viewed products">
              <RankedTable title="Views" rows={data.mostViewed} metric="Views" />
            </Section>

            <Section density="compact" title="Most enquired products">
              <RankedTable title="Enquiries" rows={data.mostEnquired} metric="Enquiries" />
            </Section>

            {data.productsByCategory.length > 0 && (
              <Section density="compact" title="Products per category">
                <Paper variant="outlined" sx={{ p: INNER_SPACING }}>
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart
                      height={300}
                      xAxis={[
                        {
                          scaleType: 'band',
                          data: data.productsByCategory.map((row) => row.label),
                        },
                      ]}
                      series={[
                        { data: data.productsByCategory.map((row) => row.count), label: 'Products' },
                      ]}
                    />
                  </Box>
                </Paper>
              </Section>
            )}

            {data.productsByBrand.length > 0 && (
              <Section density="compact" title="Products per brand">
                <Paper variant="outlined" sx={{ p: INNER_SPACING }}>
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <BarChart
                      height={300}
                      xAxis={[
                        { scaleType: 'band', data: data.productsByBrand.map((row) => row.label) },
                      ]}
                      series={[
                        { data: data.productsByBrand.map((row) => row.count), label: 'Products' },
                      ]}
                    />
                  </Box>
                </Paper>
              </Section>
            )}
          </>
        )}
      </AsyncState>
    </AdminLayout>
  );
}
