import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ImagePlus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getImageDimensions } from '../../lib/format';

interface ImageDropZoneProps {
  label: string;
  hint?: string;
  value?: File | string | null;
  onChange: (file: File) => void;
  error?: string;
  accept?: string;
}

export function ImageDropZone({
  label,
  hint,
  value,
  onChange,
  error,
  accept = 'image/*',
}: ImageDropZoneProps) {
  const { t } = useTranslation('admin');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dimWarning, setDimWarning] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileName = value instanceof File ? value.name : null;

  // Derive the preview URL from the current value, revoking object URLs on
  // change/unmount so File previews don't leak blobs across re-renders.
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(value ?? null);
    return undefined;
  }, [value]);

  const handleFile = useCallback(
    async (file: File) => {
      setDimWarning('');
      try {
        const { width, height } = await getImageDimensions(file);
        if (width < 1000 || height < 1000) {
          setDimWarning(t('form.imageTooSmall'));
        }
      } catch {
        /* ignore */
      }
      onChange(file);
    },
    [onChange, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <Box>
      <Text fontSize="13px" fontWeight={500} mb={1} color="text.primary">
        {label}
      </Text>
      {hint && (
        <Text fontSize="11px" color="text.muted" mb={2}>
          {hint}
        </Text>
      )}
      <Box
        role="button"
        tabIndex={0}
        aria-label={label}
        border="1.5px dashed"
        borderColor={error ? 'red.400' : dragging ? 'accent.gold' : previewUrl ? 'border.gold' : 'border.subtle'}
        borderRadius="lg"
        bg={dragging ? 'rgba(201,169,97,0.05)' : 'bg.canvas'}
        cursor="pointer"
        overflow="hidden"
        position="relative"
        transition="border-color 300ms, background 300ms"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        minH="160px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ '&:hover .dy-img-overlay': { opacity: 1 } }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'accent.gold', outlineOffset: '2px' }}
      >
        {previewUrl ? (
          <>
            <Box
              as="img"
              src={previewUrl}
              alt=""
              sx={{ width: '100%', height: '200px', objectFit: 'contain', display: 'block' }}
            />
            {/* Hover overlay — affordance that the image can be replaced */}
            <Box
              className="dy-img-overlay"
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="rgba(26,26,26,0.45)"
              opacity={0}
              transition="opacity 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              pointerEvents="none"
            >
              <HStack
                spacing={2}
                bg="rgba(250,248,243,0.95)"
                color="warm.black"
                px={4}
                py={2}
                borderRadius="full"
                fontSize="12px"
                fontWeight={600}
                letterSpacing="0.06em"
              >
                <RefreshCw size={14} />
                <Text>{t('form.changeImage')}</Text>
              </HStack>
            </Box>
          </>
        ) : (
          <VStack spacing={2} py={10} px={4} color="text.muted">
            <Box color="accent.gold"><ImagePlus size={30} /></Box>
            <Text fontSize="13px" textAlign="center" fontWeight={500} color="text.primary">
              {t('form.dragDrop')}
            </Text>
            <Text fontSize="11px" textAlign="center" color="text.muted">
              {t('form.imageFormats')}
            </Text>
          </VStack>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={onInputChange}
        />
      </Box>
      {fileName && (
        <Text fontSize="11px" color="text.muted" mt={1.5} noOfLines={1}>
          {fileName}
        </Text>
      )}
      {error && (
        <Text fontSize="12px" color="red.500" mt={1}>
          {error}
        </Text>
      )}
      {dimWarning && (
        <Text fontSize="12px" color="orange.500" mt={1}>
          {dimWarning}
        </Text>
      )}
    </Box>
  );
}

export default ImageDropZone;
