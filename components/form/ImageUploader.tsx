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
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useField, useFormikContext } from 'formik';
import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

import { api } from '@/lib/http';
import { notifyError } from '@/lib/toast';
import { INNER_SPACING } from '@/theme/spacing';
import { RADIUS, SHADOW, SURFACE } from '@/theme/tokens';
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
  folder: 'products' | 'banners' | 'orders' | 'categories' | 'brands' | 'catalogue';
  /** Maximum number of files. Ignored when `single` is set. */
  maxFiles?: number;
  /** Store a single `ImageAsset` rather than an array. */
  single?: boolean;
  /** Also accept PDFs, for order attachments and the wholesale catalogue. */
  allowDocuments?: boolean;
  /**
   * Size ceiling in bytes. Defaults to {@link MAX_FILE_BYTES}.
   *
   * @remarks
   * Files go straight from the browser to Cloudinary, so the serverless body
   * limit never applies and a document can be allowed to be far larger than a
   * product photograph. Cloudinary's own per-plan ceiling still governs.
   */
  maxBytes?: number;
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
  maxBytes = MAX_FILE_BYTES,
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

      const oversized = selected.find((file) => file.size > maxBytes);
      if (oversized) {
        notifyError(
          `${oversized.name} is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`,
        );
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
    [assets, folder, maxBytes, name, remaining, setFieldTouched, setFieldValue, single],
  );

  const handleRemove = useCallback(
    (publicId: string): void => {
      const next = assets.filter((asset) => asset.publicId !== publicId);
      void setFieldValue(name, single ? null : next);
    },
    [assets, name, setFieldValue, single],
  );

  /**
   * Tracks nested drag events.
   *
   * `dragleave` fires every time the pointer crosses into a child element, so a
   * boolean flag makes the zone flicker as the cursor moves over the text
   * inside it. Counting enter/leave pairs means the highlight only clears when
   * the pointer has genuinely left the zone.
   */
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const isDisabled = isUploading || remaining <= 0;

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLElement>): void => {
      event.preventDefault();
      if (isDisabled) return;
      dragDepth.current += 1;
      setIsDragging(true);
    },
    [isDisabled],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    dragDepth.current = Math.max(dragDepth.current - 1, 0);
    if (dragDepth.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>): void => {
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      if (isDisabled) return;
      if (event.dataTransfer?.files?.length) void handleFiles(event.dataTransfer.files);
    },
    [handleFiles, isDisabled],
  );

  const errorText = typeof meta.error === 'string' && meta.touched ? meta.error : helperText;
  const isError = typeof meta.error === 'string' && meta.touched;

  const acceptedLabel = allowDocuments ? 'PNG, JPG, WebP or PDF' : 'PNG, JPG or WebP';

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>

      {/*
        A large drop target rather than a small button. Uploading imagery is the
        main task on these forms, and the control should be sized like the
        primary thing on the screen — big enough to drag a file onto without
        aiming, and stating its own limits so a rejected file is a surprise
        that never happens.
      */}
      <Box
        onDragEnter={handleDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 3,
          py: { xs: 4, md: 5 },
          textAlign: 'center',
          borderRadius: `${RADIUS.md}px`,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : isError ? 'error.main' : SURFACE.borderStrong,
          bgcolor: isDragging ? 'rgba(31, 58, 138, 0.04)' : SURFACE.subtle,
          transition: 'border-color 180ms, background-color 180ms',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled && !isUploading ? 0.6 : 1,
          '&:hover': isDisabled ? undefined : { borderColor: 'primary.main' },
          // The file input is invisible but still focusable, so the zone shows
          // a focus ring when a keyboard user tabs to it.
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(31, 58, 138, 0.12)',
          },
        }}
      >
        {isUploading ? (
          <>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Uploading…
            </Typography>
          </>
        ) : (
          <>
            <Box
              aria-hidden
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                color: 'primary.main',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <UploadIcon />
            </Box>

            <Typography sx={{ fontWeight: 600 }}>
              {remaining <= 0
                ? single
                  ? 'Replace the file below to change it'
                  : `Maximum of ${limit} files reached`
                : 'Drag and drop, or click to browse'}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {acceptedLabel} · up to {Math.round(maxBytes / (1024 * 1024))} MB
              {!single && remaining > 0 && ` · ${remaining} of ${limit} remaining`}
            </Typography>
          </>
        )}

        {/*
          Stretched across the whole zone so the entire area is clickable and
          accepts a native drop, while remaining a real focusable input for
          keyboard and assistive technology.
        */}
        <Box
          component="input"
          ref={inputRef}
          type="file"
          aria-label={label}
          multiple={!single}
          disabled={isDisabled}
          accept={allowDocuments ? `${IMAGE_TYPES},application/pdf` : IMAGE_TYPES}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            if (event.target.files) void handleFiles(event.target.files);
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'inherit',
            // Firefox ignores pointer events on a zero-opacity file input's
            // button unless the whole control is stretched like this.
            fontSize: 0,
          }}
        />
      </Box>

      {assets.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: INNER_SPACING,
            gridTemplateColumns: {
              xs: 'repeat(3, minmax(0, 1fr))',
              sm: 'repeat(4, minmax(0, 1fr))',
              md: 'repeat(6, minmax(0, 1fr))',
            },
            mt: INNER_SPACING,
          }}
        >
          {assets.map((asset) => (
            <Box
              key={asset.publicId}
              sx={{
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${RADIUS.sm}px`,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                bgcolor: SURFACE.subtle,
                '&:hover .uploader__remove': { opacity: 1 },
              }}
            >
              {/* Cloudinary serves PDFs with a .pdf extension; show a label instead. */}
              {asset.url.endsWith('.pdf') ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 1 }}>
                  <Typography variant="caption" align="center">
                    PDF attachment
                  </Typography>
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
                className="uploader__remove"
                size="small"
                aria-label={`Remove ${asset.alt ?? 'image'}`}
                onClick={() => handleRemove(asset.publicId)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'background.paper',
                  boxShadow: SHADOW.sm,
                  // Always visible on touch, where there is no hover to reveal it.
                  opacity: { xs: 1, md: 0 },
                  transition: 'opacity 160ms',
                  '&:hover': { bgcolor: 'background.paper' },
                  '&:focus-visible': { opacity: 1 },
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {errorText && <FormHelperText error={isError}>{errorText}</FormHelperText>}
    </Box>
  );
}
