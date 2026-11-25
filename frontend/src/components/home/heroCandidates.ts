import type { Product } from '../../lib/api';
import type { MenuIndex } from '../../lib/menu';

const showable = (p: Product) => p.is_available && Boolean(p.display_image || p.styled_image);

/**
 * What goes on the home page hero. The owner decides: every product marked
 * featured (is_featured), in the menu's own order. Only when nothing is
 * featured does the hero choose for itself — the new, then cakes, then the
 * rest. (The build uses this too, to read these photos ahead of time.)
 */
export function heroCandidates(index: MenuIndex): { products: Product[]; featured: boolean } {
  const featured = index.featured.filter(showable);
  if (featured.length) return { products: featured, featured: true };
  const seen = new Set<number>();
  const cakes = index.categories.find((c) => c.slug === 'cakes');
  const products = [...index.fresh, ...(cakes ? (index.byCategory.get(cakes.id) ?? []) : []), ...index.products]
    .filter((p) => {
      if (seen.has(p.id) || !showable(p)) return false;
      seen.add(p.id);
      return true;
    })
    .slice(0, 18);
  return { products, featured: false };
}
