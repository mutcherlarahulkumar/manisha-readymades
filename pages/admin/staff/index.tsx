/**
 * Admin user management. Owner-only.
 *
 * @module pages/admin/staff/index
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
import { Form, Formik, type FormikHelpers } from 'formik';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AsyncState } from '@/components/common/StateViews';
import { FormCheckboxField, FormSelectField, FormTextField, type SelectOption } from '@/components/form/fields';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useResource } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import { ADMIN_ROLES, type Admin } from '@/types/models';
import { formatDate } from '@/utils/format';
import { adminCreateSchema, adminUpdateSchema, type AdminFormValues } from '@/validation/admin.schema';

/** Values for a new admin account. */
const BLANK_ADMIN: AdminFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  isActive: true,
};

/**
 * The staff management screen.
 *
 * @returns The page element.
 */
export default function AdminStaffPage(): JSX.Element {
  const { admin: currentAdmin, hasRole } = useAuth();
  const { data, isLoading, error, refresh } = useResource<Admin[]>('/api/admins');

  const [editing, setEditing] = useState<Admin | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Admin | null>(null);

  const staff = data ?? [];
  const isOwner = hasRole(['owner']);

  const roleOptions = useMemo<SelectOption[]>(
    () =>
      ADMIN_ROLES.map((role) => ({
        value: role,
        label: role === 'owner' ? 'Owner — full access, can manage staff' : 'Staff — everything except staff management',
      })),
    [],
  );

  async function handleSubmit(
    values: AdminFormValues,
    helpers: FormikHelpers<AdminFormValues>,
  ): Promise<void> {
    try {
      if (editing) {
        await api(`/api/admins/${editing._id}`, { method: 'PUT', body: values });
        notifySuccess('Account updated');
      } else {
        await api('/api/admins', { method: 'POST', body: values });
        notifySuccess('Account created');
      }
      setEditing(null);
      setIsCreating(false);
      await refresh();
    } catch (submitError) {
      notifyError(submitError, 'Could not save this account.');
    } finally {
      helpers.setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await api(`/api/admins/${pendingDelete._id}`, { method: 'DELETE' });
      notifySuccess(`${pendingDelete.name}'s account deleted`);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      notifyError(deleteError, 'Could not delete this account.');
    }
  }

  return (
    <AdminLayout
      title="Staff"
      subtitle="Who can sign in to this dashboard"
      action={
        isOwner ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreating(true)}>
            New account
          </Button>
        ) : undefined
      }
    >
      {!isOwner && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Only owners can add, edit or remove accounts.
        </Alert>
      )}

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={staff.length === 0}
        onRetry={() => void refresh()}
        empty={{ title: 'No accounts found' }}
      >
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {member.name}
                      {member._id === currentAdmin?._id && ' (you)'}
                    </Typography>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={member.role === 'owner' ? 'Owner' : 'Staff'}
                      color={member.role === 'owner' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={member.isActive ? 'Active' : 'Deactivated'}
                      color={member.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{formatDate(member.createdAt)}</TableCell>
                  <TableCell align="right">
                    {isOwner && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setEditing(member)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {member._id !== currentAdmin?._id && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setPendingDelete(member)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
        <DialogTitle>{editing ? 'Edit account' : 'New account'}</DialogTitle>
        <DialogContent dividers>
          <Formik
            initialValues={
              editing
                ? {
                    name: editing.name,
                    email: editing.email,
                    password: '',
                    role: editing.role,
                    isActive: editing.isActive,
                  }
                : BLANK_ADMIN
            }
            // On update the password may be left blank to keep the existing one.
            validationSchema={editing ? adminUpdateSchema : adminCreateSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <Stack spacing={INNER_SPACING}>
                  <FormTextField name="name" label="Full name" required />
                  <FormTextField name="email" label="Email" type="email" required />
                  <FormTextField
                    name="password"
                    label={editing ? 'New password' : 'Password'}
                    type="password"
                    required={!editing}
                    helperText={
                      editing
                        ? 'Leave blank to keep the current password.'
                        : 'At least 8 characters, including a letter and a number.'
                    }
                  />
                  <FormSelectField name="role" label="Role" options={roleOptions} required />
                  <FormCheckboxField name="isActive" label="Account is active" />

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
        title="Delete account?"
        message={`${pendingDelete?.name ?? ''} will lose access immediately. Orders assigned to them become unassigned.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
