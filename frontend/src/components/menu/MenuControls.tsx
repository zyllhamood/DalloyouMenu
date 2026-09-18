import { forwardRef } from 'react';
import { Box, HStack, IconButton, Input, InputGroup, InputLeftElement, InputRightElement } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { VariantSize } from '../../lib/api';
import { sizeToKey } from '../../lib/productMeasurement';

export type MenuView = 'grid' | 'list';

export const SearchField = forwardRef<HTMLInputElement, { value: string; onChange: (value: string) => void }>(
  function SearchField({ value, onChange }, ref) {
    const { t } = useTranslation();
    return (
      <InputGroup w={{ base: '100%', lg: '440px' }} size="lg">
        <InputLeftElement h="58px" w="58px" pointerEvents="none" color="text.muted">
          <Search size={19} strokeWidth={1.8} />
        </InputLeftElement>
        <Input
          ref={ref}
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('menu.searchPlaceholder')}
          aria-label={t('menu.searchLabel')}
          h="58px"
          ps="56px"
          pe={value ? '56px' : 5}
          borderRadius="full"
          bg="ivory.50"
          border="1px solid"
          borderColor="border.subtle"
          fontSize="16px"
          boxShadow="0 12px 30px -24px rgba(110, 69, 21, 0.45)"
          _placeholder={{ color: 'text.muted', opacity: 0.85 }}
          _hover={{ borderColor: 'ivory.400' }}
          _focusVisible={{ borderColor: 'brand.500', boxShadow: '0 0 0 4px rgba(194, 134, 62, 0.14)' }}
          sx={{ '&::-webkit-search-cancel-button': { display: 'none' } }}
        />
        {value && (
          <InputRightElement h="58px" w="58px">
            <IconButton
              aria-label={t('menu.clearSearch')}
              icon={<X size={16} />}
              onClick={() => onChange('')}
              size="sm"
              w="34px"
              h="34px"
              minW="34px"
              borderRadius="full"
              variant="unstyled"
              display="grid"
              placeItems="center"
              bg="ivory.200"
              _hover={{ bg: 'ivory.300' }}
            />
          </InputRightElement>
        )}
      </InputGroup>
    );
  },
);

export function SizeChips({
  sizes,
  value,
  onChange,
}: {
  sizes: VariantSize[];
  value: VariantSize | null;
  onChange: (size: VariantSize | null) => void;
}) {
  const { t } = useTranslation();
  if (sizes.length === 0) return null;
  const options: (VariantSize | null)[] = [null, ...sizes];

  return (
    <HStack
      role="radiogroup"
      aria-label={t('menu.sizeFilter')}
      spacing={2}
      overflowX="auto"
      className="dy-no-scrollbar"
      pe={6}
      sx={{
        // Soft fade at the trailing edge hints that the row scrolls.
        maskImage: 'linear-gradient(to right, transparent 0, #000 28px)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 28px)',
      }}
    >
      {options.map((size) => {
        const selected = value === size;
        return (
          <Box
            key={size ?? 'all'}
            as="button"
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(size)}
            flexShrink={0}
            h="40px"
            px={5}
            borderRadius="full"
            fontSize="14px"
            fontWeight={500}
            border="1px solid"
            borderColor={selected ? 'noir.800' : 'rgba(22, 18, 14, 0.14)'}
            bg={selected ? 'noir.800' : 'transparent'}
            color={selected ? 'brand.100' : 'text.primary'}
            transition="all 300ms var(--dy-ease)"
            _hover={selected ? undefined : { borderColor: 'rgba(143, 91, 30, 0.5)', color: 'brand.700' }}
          >
            {size ? t(`sizes.${sizeToKey(size)}`) : t('menu.sizesAll')}
          </Box>
        );
      })}
    </HStack>
  );
}

export function ViewToggle({ value, onChange }: { value: MenuView; onChange: (view: MenuView) => void }) {
  const { t } = useTranslation();
  const options: { view: MenuView; label: string; icon: typeof LayoutGrid }[] = [
    { view: 'grid', label: t('menu.viewGrid'), icon: LayoutGrid },
    { view: 'list', label: t('menu.viewList'), icon: List },
  ];

  return (
    <HStack
      role="radiogroup"
      aria-label={`${t('menu.viewGrid')} / ${t('menu.viewList')}`}
      spacing={0}
      p="4px"
      borderRadius="full"
      border="1px solid"
      borderColor="rgba(22, 18, 14, 0.12)"
      bg="ivory.50"
      flexShrink={0}
    >
      {options.map(({ view, label, icon: Icon }) => {
        const selected = value === view;
        return (
          <Box
            key={view}
            as="button"
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(view)}
            position="relative"
            display="grid"
            placeItems="center"
            w="40px"
            h="34px"
            borderRadius="full"
            color={selected ? 'brand.100' : 'text.muted'}
            transition="color 300ms"
          >
            {selected && (
              <motion.span
                layoutId="menu-view"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--dy-noir)' }}
              />
            )}
            <Icon size={17} strokeWidth={1.8} style={{ position: 'relative' }} />
          </Box>
        );
      })}
    </HStack>
  );
}
