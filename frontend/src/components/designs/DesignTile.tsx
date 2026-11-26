import { Box } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import { designImage, designSrcSet, type Design } from '../../lib/designs';

interface DesignTileProps {
  design: Design;
  /** 0-based position, for its alt text. */
  index: number;
  sizes: string;
}

/**
 * One design, simply shown. The photos are shot on the house's own ivory (the
 * same colour as the page), so the cake has no frame or edge — it stands on
 * the page.
 */
export function DesignTile({ design, index, sizes }: DesignTileProps) {
  const { t } = useTranslation();

  return (
    <Box
      as="img"
      src={designImage(design, 640)}
      srcSet={designSrcSet(design)}
      sizes={sizes}
      alt={t('designs.imageAlt', { n: index + 1 })}
      loading="lazy"
      decoding="async"
      draggable={false}
      display="block"
      w="100%"
      objectFit="contain"
      sx={{ aspectRatio: '1' }}
    />
  );
}

export default DesignTile;
