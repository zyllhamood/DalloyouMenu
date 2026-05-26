/**
 * ProductsGrid — shared product grid used on both HomePage (New Arrivals)
 * and MenuPage.
 *
 * Works in two modes:
 *   Uncontrolled (default): manages its own viewMode from localStorage.
 *   Controlled: caller passes `viewMode` + `onViewModeChange` (used by
 *     MenuPage so it can place the toggle buttons in its own filter bar).
 *
 * Grid columns:
 *   Mobile  grid → 2 cols | list → 1 col
 *   Tablet (md, 768px+)    → 2 cols
 *   Desktop (lg, 992px+)   → 3 cols
 */

import { useState } from 'react';
import { Box, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { LayoutGrid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Product } from '../lib/api';
import ProductCard, { ProductCardSkeleton } from './ProductCard';

// ── Shared constants / helpers ────────────────────────────────────────────────
export const VIEW_MODE_KEY = 'menuViewMode';
export type ViewMode = 'grid' | 'list';

export function readStoredViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    return v === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

// ── ViewToggleButton (exported so MenuPage can use it in its filter bar) ──────
interface ViewToggleButtonProps {
  icon: React.ReactNode;
  active: boolean;
  label: string;
  onClick: () => void;
}

export function ViewToggleButton({ icon, active, label, onClick }: ViewToggleButtonProps) {
  return (
    <IconButton
      aria-label={label}
      icon={<>{icon}</>}
      onClick={onClick}
      size="sm"
      w="40px"
      h="40px"
      minW="40px"
      borderRadius="8px"
      bg={active ? 'warm.black' : 'transparent'}
      color={active ? 'accent.gold' : 'gray.600'}
      border="1px solid"
      borderColor={active ? 'warm.black' : 'border.subtle'}
      _hover={
        active
          ? { bg: 'warm.black' }
          : { borderColor: 'accent.gold', color: 'accent.goldDeep' }
      }
      transition="all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  const { t } = useTranslation();
  return (
    <Box py={{ base: 16, md: 24 }} textAlign="center">
      <Box
        mx="auto"
        mb={6}
        w="120px"
        h="120px"
        borderRadius="full"
        border="1px solid"
        borderColor="border.gold"
        display="grid"
        placeItems="center"
        color="accent.gold"
      >
        <Box as="svg" viewBox="0 0 48 48" w="40px" h="40px" aria-hidden>
          <path
            d="M12 18c0-6 5-11 12-11s12 5 12 11-5 11-12 11-12-5-12-11zM10 38l8-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </Box>
      </Box>
      <Text fontFamily="heading" fontSize="22px" color="text.primary">
        {t('product.empty')}
      </Text>
    </Box>
  );
}

// ── ProductsGrid ──────────────────────────────────────────────────────────────
interface ProductsGridProps {
  products: Product[];
  isLoading?: boolean;
  /**
   * Show the grid/list toggle ABOVE the grid (mobile only).
   * Pass false when the caller renders the toggle elsewhere (e.g. MenuPage filter bar).
   * Default: true
   */
  showViewToggle?: boolean;
  /** Controlled view mode — omit to let the component manage its own state. */
  viewMode?: ViewMode;
  onViewModeChange?: (m: ViewMode) => void;
}

export function ProductsGrid({
  products,
  isLoading = false,
  showViewToggle = true,
  viewMode: viewModeProp,
  onViewModeChange,
}: ProductsGridProps) {
  const [internalMode, setInternalMode] = useState<ViewMode>(readStoredViewMode);

  const isControlled = viewModeProp !== undefined;
  const viewMode = isControlled ? viewModeProp! : internalMode;

  const handleChange = (m: ViewMode) => {
    if (isControlled) {
      onViewModeChange?.(m);
    } else {
      setInternalMode(m);
      try { localStorage.setItem(VIEW_MODE_KEY, m); } catch { /* ignore */ }
    }
  };

  const gridColumns = { base: viewMode === 'list' ? 1 : 2, md: 2, lg: 3 };
  const gridGap = { base: viewMode === 'list' ? 4 : 5, md: 8, lg: 10 };

  return (
    <>
      {/* Mobile toggle strip — only rendered when showViewToggle is true */}
      {showViewToggle && (
        <Box
          display={{ base: 'flex', md: 'none' }}
          justifyContent="flex-end"
          gap={1}
          mb={4}
        >
          <ViewToggleButton
            icon={<LayoutGrid size={16} />}
            active={viewMode === 'grid'}
            label="Grid view"
            onClick={() => handleChange('grid')}
          />
          <ViewToggleButton
            icon={<List size={16} />}
            active={viewMode === 'list'}
            label="List view"
            onClick={() => handleChange('list')}
          />
        </Box>
      )}

      {isLoading ? (
        <SimpleGrid columns={gridColumns} spacing={gridGap}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <ProductCardSkeleton key={`pg-skel-${i}`} />
          ))}
        </SimpleGrid>
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <SimpleGrid columns={gridColumns} spacing={gridGap}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              listMode={viewMode === 'list'}
            />
          ))}
        </SimpleGrid>
      )}
    </>
  );
}

export default ProductsGrid;
