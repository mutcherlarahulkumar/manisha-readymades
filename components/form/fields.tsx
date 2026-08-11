/**
 * Formik-bound MUI field components.
 *
 * Each field reads its value, error and touched state from Formik by name, so
 * pages never wire `onChange`/`onBlur` by hand and every field reports errors
 * identically. Errors surface only after a field has been touched or the form
 * has been submitted once.
 *
 * @module components/form/fields
 */
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { useField, useFormikContext } from 'formik';
import type { ReactNode } from 'react';

/** An option in a select or autocomplete field. */
export interface SelectOption {
  value: string;
  label: string;
  /** Optional secondary line, e.g. a SKU or parent category. */
  hint?: string;
}

/**
 * Resolves the message to display beneath a field.
 *
 * @param error - Formik's error for the field.
 * @param touched - Whether the field has been touched.
 * @param helperText - Static guidance shown when there is no error.
 * @returns The message and whether it represents an error.
 */
function resolveHelper(
  error: string | undefined,
  touched: boolean,
  helperText?: string,
): { text: ReactNode; isError: boolean } {
  const showError = Boolean(error) && touched;
  return { text: showError ? error : helperText, isError: showError };
}

/** Props shared by every field in this module. */
interface BaseFieldProps {
  /** Formik field path. */
  name: string;
  /** Visible label. */
  label: string;
  /** Guidance shown when the field has no error. */
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

/** Props for {@link FormTextField}. */
interface FormTextFieldProps extends BaseFieldProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'date' | 'url';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  /** Rendered at the start of the input, e.g. a rupee sign. */
  startAdornment?: ReactNode;
}

/**
 * A Formik-bound text, number, date or password input.
 *
 * @param props - Field configuration.
 * @returns The field element.
 */
export function FormTextField({
  name,
  label,
  helperText,
  type = 'text',
  placeholder,
  multiline = false,
  rows = 4,
  disabled = false,
  required = false,
  startAdornment,
}: FormTextFieldProps): JSX.Element {
  const [field, meta] = useField<string | number>(name);
  const { text, isError } = resolveHelper(meta.error, meta.touched, helperText);

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      id={name}
      label={label}
      type={type}
      placeholder={placeholder}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      disabled={disabled}
      required={required}
      error={isError}
      helperText={text}
      // Date inputs need a permanently shrunk label or the placeholder overlaps it.
      InputLabelProps={type === 'date' ? { shrink: true } : undefined}
      InputProps={startAdornment ? { startAdornment } : undefined}
    />
  );
}

/** Props for {@link FormDateField}. */
interface FormDateFieldProps extends BaseFieldProps {
  /** Allows the field to be cleared, storing `null`. */
  clearable?: boolean;
}

/**
 * A Formik-bound date field.
 *
 * Yup and Mongoose both work in `Date`, while a native date input works in
 * `YYYY-MM-DD` strings. This component owns that conversion so no schema has to
 * accept both representations.
 *
 * @param props - Field configuration.
 * @returns The field element.
 */
export function FormDateField({
  name,
  label,
  helperText,
  disabled = false,
  required = false,
  clearable = false,
}: FormDateFieldProps): JSX.Element {
  const [field, meta] = useField<Date | string | null>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const { text, isError } = resolveHelper(
    typeof meta.error === 'string' ? meta.error : undefined,
    meta.touched,
    helperText,
  );

  // Accepts a Date (edit) or an ISO string (server payload) and renders both.
  const inputValue = (() => {
    if (!field.value) return '';
    const date = field.value instanceof Date ? field.value : new Date(field.value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  })();

  return (
    <TextField
      id={name}
      name={name}
      label={label}
      type="date"
      value={inputValue}
      disabled={disabled}
      required={required}
      error={isError}
      helperText={text}
      InputLabelProps={{ shrink: true }}
      onBlur={() => setFieldTouched(name, true)}
      onChange={(event) => {
        const raw = event.target.value;
        if (!raw) {
          void setFieldValue(name, clearable ? null : '');
          return;
        }
        void setFieldValue(name, new Date(`${raw}T00:00:00`));
      }}
    />
  );
}

/** Props for {@link FormSelectField}. */
interface FormSelectFieldProps extends BaseFieldProps {
  options: readonly SelectOption[];
  /** Adds a blank option, for genuinely optional selections. */
  allowEmpty?: boolean;
  emptyLabel?: string;
}

/**
 * A Formik-bound single-choice dropdown.
 *
 * @param props - Field configuration and options.
 * @returns The field element.
 */
export function FormSelectField({
  name,
  label,
  options,
  helperText,
  allowEmpty = false,
  emptyLabel = 'None',
  disabled = false,
  required = false,
}: FormSelectFieldProps): JSX.Element {
  const [field, meta] = useField<string | null>(name);
  const { text, isError } = resolveHelper(meta.error, meta.touched, helperText);
  const labelId = `${name}-label`;

  return (
    <FormControl fullWidth size="small" error={isError} disabled={disabled} required={required}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        {...field}
        labelId={labelId}
        id={name}
        label={label}
        value={field.value ?? ''}
        onChange={(event) => field.onChange({ target: { name, value: event.target.value } })}
      >
        {allowEmpty && (
          <MenuItem value="">
            <em>{emptyLabel}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {text && <FormHelperText>{text}</FormHelperText>}
    </FormControl>
  );
}

/** Props for {@link FormMultiSelectField}. */
interface FormMultiSelectFieldProps extends BaseFieldProps {
  options: readonly SelectOption[];
}

/**
 * A Formik-bound multi-choice autocomplete, used for sizes and discount targets.
 *
 * @param props - Field configuration and options.
 * @returns The field element.
 */
export function FormMultiSelectField({
  name,
  label,
  options,
  helperText,
  disabled = false,
  required = false,
}: FormMultiSelectFieldProps): JSX.Element {
  const [field, meta] = useField<string[]>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const { text, isError } = resolveHelper(
    typeof meta.error === 'string' ? meta.error : undefined,
    meta.touched,
    helperText,
  );

  const selected = options.filter((option) => (field.value ?? []).includes(option.value));

  return (
    <Autocomplete
      multiple
      id={name}
      options={options}
      value={selected}
      disabled={disabled}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onChange={(_event, next) => {
        void setFieldValue(
          name,
          next.map((option) => option.value),
        );
      }}
      onBlur={() => setFieldTouched(name, true)}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip size="small" label={option.label} {...getTagProps({ index })} key={option.value} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={isError}
          helperText={text}
        />
      )}
    />
  );
}

/** Props for {@link FormTagsField}. */
interface FormTagsFieldProps extends BaseFieldProps {
  placeholder?: string;
}

/**
 * A Formik-bound free-text tag input, used for product colours where the set of
 * values is open-ended.
 *
 * @param props - Field configuration.
 * @returns The field element.
 */
export function FormTagsField({
  name,
  label,
  helperText,
  placeholder = 'Type and press Enter',
  disabled = false,
  required = false,
}: FormTagsFieldProps): JSX.Element {
  const [field, meta] = useField<string[]>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const { text, isError } = resolveHelper(
    typeof meta.error === 'string' ? meta.error : undefined,
    meta.touched,
    helperText,
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      id={name}
      options={[] as string[]}
      value={field.value ?? []}
      disabled={disabled}
      onChange={(_event, next) => {
        // Trim and de-duplicate case-insensitively so "Black" and "black"
        // cannot both end up on the same product.
        const cleaned: string[] = [];
        for (const raw of next as string[]) {
          const value = raw.trim();
          if (value && !cleaned.some((item) => item.toLowerCase() === value.toLowerCase())) {
            cleaned.push(value);
          }
        }
        void setFieldValue(name, cleaned);
      }}
      onBlur={() => setFieldTouched(name, true)}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip size="small" label={option} {...getTagProps({ index })} key={option} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={isError}
          helperText={text}
        />
      )}
    />
  );
}

/** Props for {@link FormCheckboxField}. */
type FormCheckboxFieldProps = BaseFieldProps;

/**
 * A Formik-bound checkbox for boolean flags such as "Featured".
 *
 * @param props - Field configuration.
 * @returns The field element.
 */
export function FormCheckboxField({
  name,
  label,
  helperText,
  disabled = false,
}: FormCheckboxFieldProps): JSX.Element {
  const [field, meta] = useField<boolean>({ name, type: 'checkbox' });
  const { text, isError } = resolveHelper(meta.error, meta.touched, helperText);

  return (
    <FormControl error={isError} disabled={disabled} component="fieldset" variant="standard">
      <FormControlLabel
        control={<Checkbox {...field} checked={Boolean(field.value)} id={name} />}
        label={label}
      />
      {text && <FormHelperText>{text}</FormHelperText>}
    </FormControl>
  );
}
