/**
 * Discount management.
 *
 * Discounts are applied when prices are read, so switching one on or off takes
 * effect on the storefront immediately with no bulk update to products.
 *
 * @module pages/admin/discounts/index
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Form, Formik, useFormikContext, type FormikHelpers } from 'formik';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import {
  FormCheckboxField,
  FormDateField,
  FormMultiSelectField,
  FormSelectField,
  FormTextField,
  type SelectOption,
} from '@/components/form/fields';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import {
  DISCOUNT_SCOPES,
  DISCOUNT_TYPES,
  type Brand,
  type CategoryWithParent,
  type Discount,
  type ProductListItem,
} from '@/types/models';
import { formatCurrency, formatDate } from '@/utils/format';
import { discountSchema, type DiscountFormValues } from '@/validation/marketing.schema';

/** Values for a new discount, running for the next 30 days by default. */
const BLANK_DISCOUNT: DiscountFormValues = {
  title: '',
  description: undefined,
  scope: 'all',
  targetIds: [],
  type: 'percent',
  value: 10,
  startsAt: new Date(),
  endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isActive: true,
};

/** Human-readable label per scope. */
const SCOPE_LABEL: Record<(typeof DISCOUNT_SCOPES)[number], string> = {
  all: 'Everything in the catalogue',
  category: 'Selected categories',
  brand: 'Selected brands',
  product: 'Selected products',
};

/**
 * The target picker, which changes its option list to match the chosen scope
 * and clears stale selections when the scope changes.
 *
 * @param props.categories - Available categories.
 * @param props.brands - Available brands.
 * @param props.products - Available products.
 * @returns The target field, or nothing when the scope is `all`.
 */
function TargetField({
  categories,
  brands,
  products,
}: {
  categories: readonly CategoryWithParent[];
  brands: readonly Brand[];
  products: readonly ProductListItem[];
}): JSX.Element | null {
  const { values } = useFormikContext<DiscountFormValues>();

  const options = useMemo<SelectOption[]>(() => {
    switch (values.scope) {
      case 'category':
        return categories.map((category) => ({
          value: category._id,
          label: category.parent ? `${category.parent.name} › ${category.name}` : category.name,
        }));
      case 'brand':
        return brands.map((brand) => ({ value: brand._id, label: brand.name }));
      case 'product':
        return products.map((product) => ({
          value: product._id,
          label: `${product.sku} · ${product.name}`,
        }));
      default:
        return [];
    }
  }, [values.scope, categories, brands, products]);

  if (values.scope === 'all') return null;

  return (
    <FormMultiSelectField
      name="targetIds"
      label="Apply to"
      options={options}
      required
      helperText="Select at least one. When several discounts match a product, the largest saving wins."
    />
  );
}

/**
 * The discount management screen.
 *
 * @returns The page element.
 */
export default function AdminDiscountsPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<Discount[]>('/api/discounts');
  const categories = useResource<CategoryWithParent[]>('/api/categories');
  const brands = useResource<Brand[]>('/api/brands');
  const products = useResource<ProductListItem[]>('/api/products?limit=60');

  const [editing, setEditing] = useState<Discount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Discount | null>(null);

  const discounts = data ?? [];

  const scopeOptions = useMemo<SelectOption[]>(
    () => DISCOUNT_SCOPES.map((scope) => ({ value: scope, label: SCOPE_LABEL[scope] })),
    [],
  );

  const typeOptions = useMemo<SelectOption[]>(
    () =>
      DISCOUNT_TYPES.map((type) => ({
        value: type,
        label: type === 'percent' ? 'Percentage off (%)' : 'Flat amount off (₹)',
      })),
    [],
  );

  async function handleSubmit(
    values: DiscountFormValues,
    helpers: FormikHelpers<DiscountFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/discounts/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Discount updated');
      } else {
        await api('/api/discounts', { method: 'POST', body: values });
        notifySuccess('Discount created');
      }
      setEditing(null);
      setIsCreating(false);
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this discount.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/discounts/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess('Discount deleted — prices revert immediately');
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not delete this discount.');
    }
  }

  return (
    <AdminLayout
      title="Discounts"
      subtitle="Bulk sales and flat reductions across the catalogue"
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>
          New discount
        </Button>
      }
    >
      <Alert severity="info" sx={{ mb: 3 }}>
        Discounts apply automatically while they are active and within their dates. Product prices
        are never overwritten, so removing a discount restores the original price at once.
      </Alert>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={discounts.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No discounts yet',
          description: 'Create a flat sale or a percentage reduction across products, brands or categories.',
          action: (
            <Button variant="contained" onClick={() => setIsCreating(true)}>
              Add discount
            </Button>
          ),
        }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Applies to</TableCell>
                <TableCell align="right">Reduction</TableCell>
                <TableCell>Runs</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discounts.map((discount) => {
                const now = Date.now();
                const isLive =
                  discount.isActive &&
                  new Date(discount.startsAt).getTime() <= now &&
                  new Date(discount.endsAt).getTime() >= now;

                return (
                  <TableRow key={discount._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {discount.title}
                      </Typography>
                      {discount.description && (
                        <Typography variant="caption" color="text.secondary">
                          {discount.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {SCOPE_LABEL[discount.scope]}
                      {discount.targetIds.length > 0 && ` (${discount.targetIds.length})`}
                    </TableCell>
                    <TableCell align="right">
                      {discount.type === 'percent'
                        ? `${discount.value}%`
                        : formatCurrency(discount.value)}
                    </TableCell>
                    <TableCell>
                      {formatDate(discount.startsAt)} – {formatDate(discount.endsAt)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isLive ? 'Live' : discount.isActive ? 'Scheduled / ended' : 'Off'}
                        color={isLive ? 'success' : discount.isActive ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditing(discount)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setPendingDelete(discount)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </AsyncState>

      <Dialog
        open={isCreating || editing !== null}
        onClose={() => {
          setEditing(null);
          setIsCreating(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editing ? 'Edit discount' : 'New discount'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? {
                    title: editing.title,
                    description: editing.description,
                    scope: editing.scope,
                    targetIds: editing.targetIds,
                    type: editing.type,
                    value: editing.value,
                    startsAt: new Date(editing.startsAt),
                    endsAt: new Date(editing.endsAt),
                    isActive: editing.isActive,
                  }
                : BLANK_DISCOUNT
            }
            validationSchema={discountSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form noValidate>
                <Stack spacing={INNER_SPACING}>
                  <FormTextField name="title" label="Title" required helperText="Shown on the product badge, e.g. “Diwali Sale”." />
                  <FormTextField name="description" label="Internal note" multiline rows={2} />

                  <FormSelectField
                    name="scope"
                    label="Applies to"
                    options={scopeOptions}
                    required
                    // Targets from the previous scope would be meaningless.
                    helperText="Changing this clears any selected targets."
                  />
                  <TargetField
                    categories={categories.data ?? []}
                    brands={brands.data ?? []}
                    products={products.data ?? []}
                  />

                  <FormSelectField name="type" label="Reduction type" options={typeOptions} required />
                  <FormTextField
                    name="value"
                    label={values.type === 'percent' ? 'Percentage off' : 'Amount off (₹)'}
                    type="number"
                    required
                    helperText={
                      values.type === 'percent'
                        ? 'Between 1 and 90.'
                        : 'Flat rupees off. Prices never fall below ₹1.'
                    }
                  />

                  <FormDateField
                    name="startsAt"
                    label="Starts on"
                    required
                    helperText="The discount begins at the start of this day."
                  />
                  <FormDateField name="endsAt" label="Ends on" required />

                  <FormCheckboxField name="isActive" label="Active" />

                  <Stack direction="row" spacing={INNER_SPACING} justifyContent="flex-end">
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setIsCreating(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      onClick={() => {
                        // Keep targets consistent with the scope on submit.
                        if (values.scope === 'all' && values.targetIds.length > 0) {
                          void setFieldValue('targetIds', []);
                        }
                      }}
                    >
                      {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete discount?"
        message={`"${pendingDelete?.title ?? ''}" will be removed and affected prices revert immediately.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
