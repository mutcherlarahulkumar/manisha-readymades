/**
 * Order tracking dashboard: status counts, search, filters and inline status
 * transitions. Internal use only — no part of this is exposed publicly.
 *
 * @module pages/admin/orders/index
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { StatCard, StatGrid } from '@/components/admin/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Section } from '@/components/common/PageContainer';
import { AsyncState } from '@/components/common/StateViews';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import type { OrderStatusCounts } from '@/services/order.service';
import { ORDER_STATUSES, type OrderStatus, type OrderWithAssignee } from '@/types/models';
import { formatDate, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/utils/format';

/** Rows per page. */
const PAGE_SIZE = 20;

/**
 * The order tracking screen.
 *
 * @returns The page element.
 */
export default function AdminOrdersPage(): JSX.Element {
  const router = useRouter();
  const { hasRole } = useAuth();

  const initialStatus = typeof router.query.statuses === 'string' ? router.query.statuses : '';

  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [statuses, setStatuses] = useState(initialStatus);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<OrderWithAssignee | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedPhone = useDebouncedValue(phone, 400);
  const debouncedCity = useDebouncedValue(city, 400);

  const listKey = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedPhone) params.set('phone', debouncedPhone);
    if (debouncedCity) params.set('city', debouncedCity);
    if (statuses) params.set('statuses', statuses);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `/api/orders?${params.toString()}`;
  }, [debouncedSearch, debouncedPhone, debouncedCity, statuses, dateFrom, dateTo, page]);

  const orders = useResource<OrderWithAssignee[]>(listKey);
  const stats = useResource<OrderStatusCounts>('/api/orders/stats');
  const rows = orders.data ?? [];

  async function changeStatus(order: OrderWithAssignee, status: OrderStatus): Promise<void> {
    try {
      await api(`/api/orders/${order._id}/status`, { method: 'PATCH', body: { status } });
      notifySuccess(`${order.orderNo} moved to ${ORDER_STATUS_LABEL[status]}`);
      await Promise.all([orders.refresh(), stats.refresh()]);
    } catch (error) {
      notifyError(error, 'Could not update this order.');
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/orders/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.orderNo} deleted`);
      setPendingDelete(null);
      await Promise.all([orders.refresh(), stats.refresh()]);
    } catch (error) {
      notifyError(error, 'Could not delete this order.');
    }
  }

  function resetFilters(): void {
    setSearch('');
    setPhone('');
    setCity('');
    setStatuses('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  return (
    <AdminLayout
      title="Orders"
      subtitle="Internal record of orders received by WhatsApp, phone or in person"
      action={
        <Button component={NextLink} href="/admin/orders/new" variant="contained" startIcon={<AddIcon />}>
          New order
        </Button>
      }
    >
      <Section density="compact" title="Tracking">
        <StatGrid columns={6}>
          <StatCard label="Pending" value={stats.data?.pending ?? 0} color="warning" />
          <StatCard label="Processing" value={stats.data?.processing ?? 0} color="info" />
          <StatCard label="Packing" value={stats.data?.packing ?? 0} color="secondary" />
          <StatCard label="Dispatched" value={stats.data?.dispatched ?? 0} color="primary" />
          <StatCard label="Completed" value={stats.data?.completed ?? 0} color="success" />
          <StatCard label="Cancelled" value={stats.data?.cancelled ?? 0} color="error" />
        </StatGrid>
      </Section>

      <Paper variant="outlined" sx={{ p: INNER_SPACING, mb: OUTER_SPACING }}>
        <Box
          sx={{
            display: 'grid',
            gap: INNER_SPACING,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          }}
        >
          <TextField
            label="Search"
            placeholder="Customer, order no. or remarks"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Mobile / WhatsApp"
            placeholder="Last 10 digits"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setPage(1);
            }}
          />
          <TextField
            label="City"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
          />
          <TextField
            select
            label="Status"
            value={statuses}
            onChange={(event) => {
              setStatuses(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {ORDER_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {ORDER_STATUS_LABEL[status]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="From date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
          />
          <TextField
            label="To date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
          />
        </Box>
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: INNER_SPACING }}>
          <Button onClick={resetFilters}>Clear filters</Button>
        </Stack>
      </Paper>

      <AsyncState
        isLoading={orders.isLoading}
        error={orders.error}
        isEmpty={rows.length === 0}
        onRetry={() => void orders.refresh()}
        empty={{
          title: 'No orders match',
          description: 'Record an order as soon as it arrives so nothing is lost in the chat history.',
          action: (
            <Button component={NextLink} href="/admin/orders/new" variant="contained">
              New order
            </Button>
          ),
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order no.</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Order date</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {order.orderNo}
                    </Typography>
                    {order.attachments.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {order.attachments.length} attachment
                        {order.attachments.length === 1 ? '' : 's'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.phone}</Typography>
                    {order.whatsapp && order.whatsapp !== order.phone && (
                      <Typography variant="caption" color="text.secondary">
                        WA: {order.whatsapp}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{order.city}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{order.assignedTo?.name ?? '—'}</TableCell>
                  <TableCell>
                    {/* Status is the field that changes most, so it is editable inline. */}
                    <Select
                      size="small"
                      value={order.status}
                      onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)}
                      renderValue={(value) => (
                        <Chip
                          size="small"
                          label={ORDER_STATUS_LABEL[value as OrderStatus]}
                          color={ORDER_STATUS_COLOR[value as OrderStatus]}
                        />
                      )}
                      sx={{ minWidth: 140 }}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {ORDER_STATUS_LABEL[status]}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton component={NextLink} href={`/admin/orders/${order._id}`} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {hasRole(['owner']) && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setPendingDelete(order)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {rows.length === PAGE_SIZE && (
          <Stack alignItems="center" sx={{ mt: OUTER_SPACING }}>
            <Pagination count={page + 1} page={page} color="primary" onChange={(_e, next) => setPage(next)} />
          </Stack>
        )}
      </AsyncState>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete order?"
        message={`${pendingDelete?.orderNo ?? ''} and its attachments will be permanently removed. This is the only record of the order.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
