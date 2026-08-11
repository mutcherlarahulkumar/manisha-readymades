/**
 * Formik-bound Cloudinary uploader.
 *
 * The file goes straight from the browser to Cloudinary using a signature
 * obtained from `/api/uploads`, so large images never pass through the
 * serverless function's body limit and the API secret never reaches the client.
 *
 * @module components/form/ImageUploader
 */
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/CloudUpload';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useField, useFormikContext } from 'formik';
import { useCallback, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/http';
import { notifyError } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import type { ImageAsset } from '@/types/models';

/** Response from `/api/uploads`. */
interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

/** The subset of Cloudinary's upload response we persist. */
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/** Maximum accepted file size in bytes (8 MB). */
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** MIME types accepted for product and banner imagery. */
const IMAGE_TYPES = 'image/png,image/jpeg,image/webp';

/** Props for {@link ImageUploader}. */
interface ImageUploaderProps {
  /** Formik field path holding an `ImageAsset[]`, or a single asset when `single`. */
  name: string;
  label: string;
  /** Cloudinary sub-folder; must be one the API allows. */
  folder: 'products' | 'banners' | 'orders' | 'categories' | 'brands';
  /** Maximum number of files. Ignored when `single` is set. */
  maxFiles?: number;
  /** Store a single `ImageAsset` rather than an array. */
  single?: boolean;
  /** Also accept PDFs, for order attachments. */
  allowDocuments?: boolean;
  helperText?: string;
}

/**
 * Uploads one file to Cloudinary using a server-issued signature.
 *
 * @param file - The file selected by the admin.
 * @param signature - A signature from `/api/uploads`.
 * @returns The stored asset reference.
 * @throws {Error} When Cloudinary rejects the upload.
 */
async function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
): Promise<ImageAsset> {
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signature.apiKey);
  body.append('timestamp', String(signature.timestamp));
  body.append('signature', signature.signature);
  body.append('folder', signature.folder);

  const response = await fetch(signature.uploadUrl, { method: 'POST', body });
  if (!response.ok) {
    throw new Error(`Upload failed for ${file.name}. Please try again.`);
  }

  const result = (await response.json()) as CloudinaryUploadResult;
  return { url: result.secure_url, publicId: result.public_id, alt: file.name };
}

/**
 * A Formik-bound uploader rendering a thumbnail grid with per-item removal.
 *
 * Removing an item detaches it from the form only; the Cloudinary asset is
 * deleted server-side when the parent record is deleted, so a cancelled edit
 * cannot destroy an image that is still live.
 *
 * @param props - Field configuration.
 * @returns The uploader element.
 */
export function ImageUploader({
  name,
  label,
  folder,
  maxFiles = 8,
  single = false,
  allowDocuments = false,
  helperText,
}: ImageUploaderProps): JSX.Element {
  const [field, meta] = useField<ImageAsset[] | ImageAsset | null>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoised so the upload/remove callbacks below keep a stable identity.
  const assets = useMemo<ImageAsset[]>(() => {
    if (single) return field.value ? [field.value as ImageAsset] : [];
    return (field.value as ImageAsset[] | null) ?? [];
  }, [field.value, single]);

  const limit = single ? 1 : maxFiles;
  const remaining = limit - assets.length;

  const handleFiles = useCallback(
    async (files: FileList): Promise<void> => {
      const selected = Array.from(files).slice(0, remaining);
      if (selected.length === 0) return;

      const oversized = selected.find((file) => file.size > MAX_FILE_BYTES);
      if (oversized) {
        notifyError(`${oversized.name} is larger than 8 MB.`);
        return;
      }

      setIsUploading(true);
      try {
        const signature = await api<UploadSignature>('/api/uploads', {
          method: 'POST',
          body: { folder },
        });
        const uploaded = await Promise.all(
          selected.map((file) => uploadToCloudinary(file, signature)),
        );

        await setFieldValue(name, single ? uploaded[0] : [...assets, ...uploaded]);
        await setFieldTouched(name, true, false);
      } catch (error) {
        notifyError(error, 'Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [assets, folder, name, remaining, setFieldTouched, setFieldValue, single],
  );

  const handleRemove = useCallback(
    (publicId: string): void => {
      const next = assets.filter((asset) => asset.publicId !== publicId);
      void setFieldValue(name, single ? null : next);
    },
    [assets, name, setFieldValue, single],
  );

  const errorText = typeof meta.error === 'string' && meta.touched ? meta.error : helperText;
  const isError = typeof meta.error === 'string' && meta.touched;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>

      {assets.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: INNER_SPACING,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            mb: INNER_SPACING,
          }}
        >
          {assets.map((asset) => (
            <Box
              key={asset.publicId}
              sx={{
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
              }}
            >
              {/* Cloudinary serves PDFs with a .pdf extension; show a label instead. */}
              {asset.url.endsWith('.pdf') ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                  <Typography variant="caption">PDF attachment</Typography>
                </Stack>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URLs are already optimised.
                <img
                  src={asset.url}
                  alt={asset.alt ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <IconButton
                size="small"
                aria-label={`Remove ${asset.alt ?? 'image'}`}
                onClick={() => handleRemove(asset.publicId)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Button
        component="label"
        variant="outlined"
        startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
        disabled={isUploading || remaining <= 0}
      >
        {isUploading ? 'Uploading…' : single ? 'Choose file' : `Add files (${remaining} left)`}
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={!single}
          accept={allowDocuments ? `${IMAGE_TYPES},application/pdf` : IMAGE_TYPES}
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
          }}
        />
      </Button>

      {errorText && <FormHelperText error={isError}>{errorText}</FormHelperText>}
    </Box>
  );
}
