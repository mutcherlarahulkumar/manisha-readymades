/**
 * Order create/edit form for the internal portal.
 *
 * @module components/admin/OrderForm
 */
import Button from '@mui/material/Button';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import {
  FormDateField,
  FormSelectField,
  FormTextField,
  type SelectOption,
} from '@/components/form/fields';
import { FormActions, FormPanel, FormRow } from '@/components/form/FormLayout';
import { ImageUploader } from '@/components/form/ImageUploader';
import { invalidate } from '@/hooks/useResource';
import { api } from '@/lib/http';
import { notifyError, notifySuccess } from '@/lib/toast';
import { ORDER_STATUSES, type Admin, type OrderWithAssignee } from '@/types/models';
import { ORDER_STATUS_LABEL } from '@/utils/format';
import { orderSchema, type OrderFormValues } from '@/validation/order.schema';

/** Values for a new order, dated today. */
const BLANK_ORDER: OrderFormValues = {
  customerName: '',
  phone: '',
  whatsapp: undefined,
  city: '',
  orderDate: new Date(),
  remarks: undefined,
  attachments: [],
  status: 'pending',
  assignedTo: null,
};

/** Props for {@link OrderForm}. */
interface OrderFormProps {
  /** The order being edited, or `null` when creating. */
  order: OrderWithAssignee | null;
  /** Admins available for assignment. */
  staff: readonly Admin[];
}

/**
 * The order form.
 *
 * @param props - The order under edit and assignable staff.
 * @returns The form element.
 */
export function OrderForm({ order, staff }: OrderFormProps): JSX.Element {
  const router = useRouter();
  const isEdit = order !== null;

  const staffOptions = useMemo<SelectOption[]>(
    () =>
      staff
        .filter((member) => member.isActive)
        .map((member) => ({ value: member._id, label: member.name })),
    [staff],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () => ORDER_STATUSES.map((status) => ({ value: status, label: ORDER_STATUS_LABEL[status] })),
    [],
  );

  async function handleSubmit(
    values: OrderFormValues,
    helpers: FormikHelpers<OrderFormValues>,
  ): Promise<void> {
    try {
      if (isEdit) {
        await api(`/api/orders/${order._id}`, { method: 'PUT', body: values });
        notifySuccess('Order updated');
      } else {
        await api('/api/orders', { method: 'POST', body: values });
        notifySuccess('Order recorded');
      }
      await invalidate('/api/orders');
      await router.push('/admin/orders');
    } catch (error) {
      notifyError(error, 'Could not save this order.');
      helpers.setSubmitting(false);
    }
  }

  return (
    <Formik
      initialValues={
        order
          ? {
              customerName: order.customerName,
              phone: order.phone,
              whatsapp: order.whatsapp,
              city: order.city,
              orderDate: new Date(order.orderDate),
              remarks: order.remarks,
              attachments: order.attachments,
              status: order.status,
              assignedTo: order.assignedTo?._id ?? null,
            }
          : BLANK_ORDER
      }
      validationSchema={orderSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form noValidate>
          <FormPanel title="Customer" description="Who placed the order and how to reach them.">
            <FormTextField name="customerName" label="Customer or shop name" required />
            <FormRow>
              <FormTextField
                name="phone"
                label="Contact number"
                type="tel"
                required
                helperText="10-digit mobile number."
              />
              <FormTextField
                name="whatsapp"
                label="WhatsApp number"
                type="tel"
                helperText="Leave empty if the same as the contact number."
              />
            </FormRow>
            <FormRow>
              <FormTextField name="city" label="City" required />
              <FormDateField name="orderDate" label="Order date" required />
            </FormRow>
          </FormPanel>

          <FormPanel
            title="Order details"
            description="Attach the WhatsApp screenshot, photo of the written order, or a PDF."
          >
            <ImageUploader
              name="attachments"
              label="Attachments"
              folder="orders"
              maxFiles={10}
              allowDocuments
              helperText="Images or PDFs, up to 10 files of 8 MB each."
            />
            <FormTextField
              name="remarks"
              label="Remarks"
              multiline
              rows={4}
              helperText="Quantities, sizes, special instructions, agreed rate."
            />
          </FormPanel>

          <FormPanel title="Tracking" description="Where the order sits and who is handling it.">
            <FormRow>
              <FormSelectField name="status" label="Status" options={statusOptions} required />
              <FormSelectField
                name="assignedTo"
                label="Assigned to"
                options={staffOptions}
                allowEmpty
                emptyLabel="Unassigned"
                helperText="Optional."
              />
            </FormRow>
          </FormPanel>

          <FormActions>
            <Button onClick={() => router.push('/admin/orders')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Record order'}
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );
}
