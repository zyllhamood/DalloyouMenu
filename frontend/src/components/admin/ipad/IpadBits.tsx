import { forwardRef, type ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import { ImageOff } from 'lucide-react';

import { thumbnailUrl } from '../../../lib/images';

/** The six-dot grip used for drag-to-reorder (matches the categories page). */
export const DragHandle = forwardRef<HTMLDivElement, BoxProps & { label: string; disabled?: boolean }>(
  function DragHandle({ label, disabled, ...rest }, ref) {
    return (
      <Box
        ref={ref}
        aria-label={label}
        display="grid"
        placeItems="center"
        w="36px"
        h="36px"
        flexShrink={0}
        borderRadius="8px"
        color="text.muted"
        cursor={disabled ? 'default' : 'grab'}
        opacity={disabled ? 0.3 : 1}
        sx={{ touchAction: 'none', '&:active': { cursor: disabled ? 'default' : 'grabbing' } }}
        _hover={disabled ? undefined : { bg: 'bg.canvas', color: 'accent.goldDeep' }}
        transition="all 200ms"
        {...rest}
      >
        <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" aria-hidden>
          <path
            d="M9 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6-16a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
            fill="currentColor"
          />
        </Box>
      </Box>
    );
  },
);

/** A square thumbnail of a stored image (product or iPad photo). */
export function Thumb({ path, size = 56, dimmed }: { path: string | null | undefined; size?: number; dimmed?: boolean }) {
  const src = thumbnailUrl(path, 160);
  return (
    <Box
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      borderRadius="md"
      overflow="hidden"
      bg="bg.canvas"
      border="1px solid"
      borderColor="border.subtle"
      display="grid"
      placeItems="center"
      color="text.muted"
      opacity={dimmed ? 0.45 : 1}
    >
      {src ? (
        <Box as="img" src={src} alt="" loading="lazy" w="100%" h="100%" objectFit="cover" />
      ) : (
        <ImageOff size={18} />
      )}
    </Box>
  );
}

const TONES = {
  neutral: { bg: 'bg.canvas', color: 'text.muted', borderColor: 'border.subtle' },
  gold: { bg: 'rgba(194, 134, 62, 0.1)', color: 'accent.goldDeep', borderColor: 'border.gold' },
  danger: { bg: 'red.50', color: 'red.600', borderColor: 'red.200' },
} as const;

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      px={2}
      py="1px"
      borderRadius="full"
      fontSize="11px"
      fontWeight={600}
      border="1px solid"
      whiteSpace="nowrap"
      {...TONES[tone]}
    >
      {children}
    </Box>
  );
}
