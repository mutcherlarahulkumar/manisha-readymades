/**
 * Category management.
 *
 * The catalogue is two levels deep — a main category such as MEN, with
 * sub-categories such as T-Shirts inside it. The screen is built to make that
 * shape obvious: the list is drawn as the tree it is, and a sub-category is
 * created from inside the main category it belongs to, so its placement is a
 * consequence of where the admin clicked rather than a field to reason about.
 *
 * @module pages/admin/categories/index
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Form, Formik, useFormikContext, type FormikHelpers } from 'formik';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import {
  FormCheckboxField,
  FormSelectField,
  FormTextField,
  type SelectOption,
} from '@/components/form/fields';
import { ImageUploader } from '@/components/form/ImageUploader';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING, OUTER_SPACING } from '@/theme/spacing';
import { RADIUS, SURFACE } from '@/theme/tokens';
import type { CategoryWithParent } from '@/types/models';
import { categorySchema, type CategoryFormValues } from '@/validation/taxonomy.schema';

/** Values for a new category. */
const BLANK_CATEGORY: CategoryFormValues = {
  name: '',
  parent: null,
  description: undefined,
  image: null,
  sortOrder: 0,
  isActive: true,
};

/** A main category together with the sub-categories filed under it. */
interface CategoryGroup {
  parent: CategoryWithParent;
  children: CategoryWithParent[];
}

/**
 * Chooses whether a category sits at the top level or inside another.
 *
 * @param props - The main categories available as a destination.
 * @returns The placement control.
 *
 * @remarks
 * Replaces a bare "Parent category" dropdown, which asked the admin to hold the
 * tree in their head and to read an empty value as "this is a main category".
 * The two cases are named for what they are, and the destination list only
 * appears once it is relevant.
 */
function CategoryPlacementField({ options }: { options: SelectOption[] }): JSX.Element {
  const { values, setFieldValue } = useFormikContext<CategoryFormValues>();
  const isSub = values.parent !== null;

  // Remembers the last destination, so toggling to "main" and back does not
  // silently clear a choice the admin already made.
  const [lastParent, setLastParent] = useState<string | null>(values.parent ?? null);

  const hasDestinations = options.length > 0;

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 1 }}>
        Where does this go?
      </Typography>

      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={isSub ? 'sub' : 'main'}
        onChange={(_event, next: 'main' | 'sub' | null) => {
          if (next === null) return;
          if (next === 'main') {
            setLastParent(values.parent ?? null);
            void setFieldValue('parent', null);
          } else {
            void setFieldValue('parent', lastParent ?? options[0]?.value ?? null);
          }
        }}
      >
        <ToggleButton value="main">Main category</ToggleButton>
        <ToggleButton value="sub" disabled={!hasDestinations}>
          Sub-category
        </ToggleButton>
      </ToggleButtonGroup>

      <FormHelperText sx={{ mx: 0, mt: 0.75 }}>
        {isSub
          ? 'Shown in the drop-down under its main category.'
          : 'Appears in the category strip beneath the site header, like MEN or WOMEN.'}
      </FormHelperText>

      {isSub && (
        <Box sx={{ mt: INNER_SPACING }}>
          <FormSelectField name="parent" label="Inside which main category?" options={options} required />
        </Box>
      )}

      {!hasDestinations && (
        <FormHelperText sx={{ mx: 0, mt: 0.75 }}>
          Create a main category first — MEN, WOMEN or KIDS — and you can then file
          sub-categories inside it.
        </FormHelperText>
      )}
    </Box>
  );
}

/** Props for {@link CategoryRow}. */
interface CategoryRowProps {
  category: CategoryWithParent;
  /** Indents and lightens the row, for a sub-category. */
  nested?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * One category in the tree.
 *
 * @param props - The category and its row actions.
 * @returns The row element.
 */
function CategoryRow({ category, nested = false, onEdit, onDelete }: CategoryRowProps): JSX.Element {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={INNER_SPACING}
      sx={{
        py: 1,
        pl: nested ? { xs: 2, sm: 4 } : 0,
        minWidth: 0,
      }}
    >
      {nested && (
        <SubdirectoryArrowRightIcon
          aria-hidden
          sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }}
        />
      )}

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: nested ? 500 : 700, wordBreak: 'break-word' }}
        >
          {category.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          /{category.slug}
        </Typography>
      </Box>

      {!category.isActive && <Chip size="small" label="Hidden" />}

      {/* The sort order is deliberately not printed here. The list is already
          drawn in that order, so the position of a row states it; a bare
          number beside every name only reads as a count of something. */}

      <Box sx={{ flexShrink: 0 }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit} aria-label={`Edit ${category.name}`}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            aria-label={`Delete ${category.name}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
}

/**
 * The category management screen.
 *
 * @returns The page element.
 */
export default function AdminCategoriesPage(): JSX.Element {
  const { data, isLoading, error, refresh } = useResource<CategoryWithParent[]>('/api/categories');
  const [editing, setEditing] = useState<CategoryWithParent | null>(null);
  /**
   * Holds the draft while the dialog is open for a new category.
   *
   * Carrying the whole set of initial values rather than a boolean is what lets
   * "Add sub-category" inside MEN open a form that is already filed under MEN.
   */
  const [creating, setCreating] = useState<CategoryFormValues | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategoryWithParent | null>(null);

  const categories = useMemo(() => data ?? [], [data]);

  /** The catalogue as the two-level tree it actually is. */
  const groups = useMemo<CategoryGroup[]>(() => {
    const parents = categories.filter((category) => category.parent === null);
    return parents.map((parent) => ({
      parent,
      children: categories.filter((category) => category.parent?._id === parent._id),
    }));
  }, [categories]);

  // A category cannot be filed inside itself, and the tree is capped at two
  // levels, so only main categories are ever destinations.
  const parentOptions = useMemo<SelectOption[]>(
    () =>
      categories
        .filter((category) => category.parent === null && category._id !== editing?._id)
        .map((category) => ({ value: category._id, label: category.name })),
    [categories, editing],
  );

  const isDialogOpen = creating !== null || editing !== null;

  function closeDialog(): void {
    setEditing(null);
    setCreating(null);
  }

  async function handleSubmit(
    values: CategoryFormValues,
    helpers: FormikHelpers<CategoryFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/categories/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Category updated');
      } else {
        await api('/api/categories', { method: 'POST', body: values });
        notifySuccess('Category created');
      }
      closeDialog();
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this category.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/categories/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      // A 409 here means products or sub-categories still reference it.
      notifyError(deleteError, 'Could not delete this category.');
    }
  }

  return (
    <AdminLayout
      title="Categories"
      subtitle="Main categories hold sub-categories — MEN → T-Shirts"
      action={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreating({ ...BLANK_CATEGORY })}
        >
          New main category
        </Button>
      }
    >
      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={categories.length === 0}
        onRetry={() => void refresh()}
        empty={{
          title: 'No categories yet',
          description:
            'Start with the main categories a shopper browses by — MEN, WOMEN, KIDS — then add sub-categories such as T-Shirts inside each one.',
          action: (
            <Button variant="contained" onClick={() => setCreating({ ...BLANK_CATEGORY })}>
              Add main category
            </Button>
          ),
        }}
      >
        <Stack spacing={OUTER_SPACING}>
          {groups.map(({ parent, children }) => (
            <Paper key={parent._id} variant="outlined" sx={{ p: OUTER_SPACING }}>
              <CategoryRow
                category={parent}
                onEdit={() => setEditing(parent)}
                onDelete={() => setPendingDelete(parent)}
              />

              <Divider sx={{ my: 1 }} />

              {children.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1, pl: { xs: 2, sm: 4 } }}>
                  No sub-categories yet.
                </Typography>
              ) : (
                children.map((child) => (
                  <CategoryRow
                    key={child._id}
                    nested
                    category={child}
                    onEdit={() => setEditing(child)}
                    onDelete={() => setPendingDelete(child)}
                  />
                ))
              )}

              {/* Placement is decided by which card this was clicked in, so the
                  admin never has to answer the question in the form. */}
              <Button
                size="small"
                startIcon={<AddIcon />}
                sx={{ mt: 1, ml: { xs: 2, sm: 4 } }}
                onClick={() => setCreating({ ...BLANK_CATEGORY, parent: parent._id })}
              >
                Add sub-category to {parent.name}
              </Button>
            </Paper>
          ))}
        </Stack>
      </AsyncState>

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? {
                    name: editing.name,
                    parent: editing.parent?._id ?? null,
                    description: editing.description,
                    image: editing.image ?? null,
                    sortOrder: editing.sortOrder,
                    isActive: editing.isActive,
                  }
                : (creating ?? BLANK_CATEGORY)
            }
            validationSchema={categorySchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={OUTER_SPACING}>
                  <FormTextField name="name" label="Category name" required />

                  <Box
                    sx={{
                      p: INNER_SPACING,
                      borderRadius: `${RADIUS.sm}px`,
                      bgcolor: SURFACE.subtle,
                    }}
                  >
                    <CategoryPlacementField options={parentOptions} />
                  </Box>

                  <FormTextField name="description" label="Description" multiline rows={2} />
                  <FormTextField
                    name="sortOrder"
                    label="Sort order"
                    type="number"
                    helperText="Lower numbers appear first."
                  />
                  <ImageUploader name="image" label="Category image" folder="categories" single />
                  <FormCheckboxField name="isActive" label="Visible on the storefront" />

                  <Stack direction="row" spacing={INNER_SPACING} justifyContent="flex-end">
                    <Button onClick={closeDialog} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
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
        title="Delete category?"
        message={`"${pendingDelete?.name ?? ''}" will be removed. Categories that still contain products or sub-categories cannot be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
