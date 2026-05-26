import { useCallback, useRef, useState } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
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

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : (value ?? null);

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
        border="1.5px dashed"
        borderColor={error ? 'red.400' : dragging ? 'accent.gold' : 'border.subtle'}
        borderRadius="lg"
        bg={dragging ? 'rgba(201,169,97,0.05)' : 'bg.canvas'}
        cursor="pointer"
        overflow="hidden"
        transition="border-color 300ms, background 300ms"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        minH="140px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {previewUrl ? (
          <Box
            as="img"
            src={previewUrl}
            alt=""
            sx={{ width: '100%', height: '200px', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <VStack spacing={2} py={8} px={4} color="text.muted">
            <Box as="svg" viewBox="0 0 24 24" w="32px" h="32px">
              <path
                d="M12 16V8m-4 4 4-4 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 16v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </Box>
            <Text fontSize="13px" textAlign="center">
              {t('form.dragDrop')}
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
