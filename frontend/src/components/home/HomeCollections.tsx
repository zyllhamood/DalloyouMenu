import { useState } from 'react';
import { Box, Button, Container, Flex, Text } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ProductImage from '../product/ProductImage';
import type { MenuCategory, Product } from '../../lib/api';
import { categoryName, displayName, useMenuIndex } from '../../lib/menu';
import { COPY } from './content';
import { ARCH_RADIUS, CONTAINER_W, DUR, EASE, TYPE, VIEWPORT } from './tokens';
import HomeSection from './HomeSection';
import RevealWords from './RevealWords';
import SectionMarker from './SectionMarker';

const PANEL_H = { lg: '540px', xl: '580px' };

interface NicheProps {
  category: MenuCategory;
  products: Product[];
  index: number;
  active: boolean;
  /** First tile spans the row on phones when the count is odd. */
  wide: boolean;
  onActivate: () => void;
}

/**
 * One category as a lit vitrine niche. On desktop the niches stand in a row
 * and the one under the pointer widens (the others make room), revealing a
 * few of its pieces by name. On phones they sit in a two-column grid.
 */
function Niche({ category, products, index, active, wide, onActivate }: NicheProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const cover = products.find((p) => p.is_featured) ?? products[0];
  const name = categoryName(category);
  const teaser = products
    .slice(0, 3)
    .map((p) => displayName(p))
    .join(' · ');

  return (
    <Box
      as={motion.div}
      gridColumn={wide ? 'span 2' : undefined}
      flexGrow={{ lg: active ? 2.3 : 1 }}
      flexBasis={{ lg: 0 }}
      minW={0}
      transition="flex-grow 800ms var(--dy-ease)"
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 60 },
        show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE, delay: index * 0.1 } },
      }}
    >
      <Box
        as={RouterLink}
        to={`/menu/${category.slug}`}
        onMouseEnter={onActivate}
        onFocus={onActivate}
        aria-label={`${name} — ${t('menu.items', { count: products.length })}`}
        role="group"
        position="relative"
        display="block"
        overflow="hidden"
        borderRadius={wide ? { base: '200px 200px 22px 22px', lg: ARCH_RADIUS } : ARCH_RADIUS}
        h={PANEL_H}
        bg="ivory.300"
        boxShadow="0 30px 60px -40px rgba(62, 38, 14, 0.65)"
        sx={{
          aspectRatio: { base: wide ? '16 / 11' : '3 / 4', lg: 'auto' },
          isolation: 'isolate',
          '.dy-niche-img': { transition: 'transform 1400ms var(--dy-ease)' },
          '@media (hover: hover)': { '&:hover .dy-niche-img': { transform: 'scale(1.06)' } },
        }}
      >
        {cover && (
          <ProductImage
            product={cover}
            className="dy-niche-img"
            sizes="(min-width: 62em) 560px, 50vw"
            style={{ position: 'absolute', inset: 0 }}
          />
        )}

        {/* Dusk at the foot, so the name always reads */}
        <Box
          position="absolute"
          inset={0}
          zIndex={1}
          pointerEvents="none"
          sx={{ background: 'linear-gradient(180deg, rgba(14,11,8,0) 38%, rgba(14,11,8,0.35) 62%, rgba(14,11,8,0.86) 100%)' }}
        />
        {/* Inner hairline — the vitrine's frame */}
        <Box
          position="absolute"
          inset={{ base: '7px', md: '10px' }}
          zIndex={2}
          borderRadius="inherit"
          border="1px solid rgba(244, 238, 227, 0.34)"
          pointerEvents="none"
        />

        <Text
          position="absolute"
          top={{ base: '16%', lg: '9%' }}
          insetInline={0}
          zIndex={2}
          textAlign="center"
          lang="en"
          dir="ltr"
          fontFamily="latin"
          fontSize={{ base: '11px', md: '12px' }}
          letterSpacing="0.2em"
          color="rgba(244, 238, 227, 0.8)"
        >
          {String(index + 1).padStart(2, '0')}
        </Text>

        <Flex
          position="absolute"
          insetInline={0}
          bottom={0}
          zIndex={2}
          direction="column"
          align="center"
          textAlign="center"
          px={{ base: 3, md: 6 }}
          pb={{ base: 5, md: 8 }}
          color="text.onDark"
        >
          <Text {...TYPE.card} fontSize={{ base: '21px', sm: '26px', lg: '30px', xl: '34px' }} lineHeight={1.3}>
            {name}
          </Text>
          <Text mt={1} fontSize={{ base: '12.5px', md: '13.5px' }} color="rgba(244, 238, 227, 0.75)">
            {t('menu.items', { count: products.length })}
          </Text>

          {/* Desktop only: what's inside, shown as the niche opens */}
          <Box
            display={{ base: 'none', lg: 'block' }}
            overflow="hidden"
            maxH={active ? '120px' : 0}
            opacity={active ? 1 : 0}
            transition="max-height 800ms var(--dy-ease), opacity 600ms var(--dy-ease)"
          >
            <Text mt={4} fontSize="14px" lineHeight={1.8} color="rgba(244, 238, 227, 0.82)" maxW="360px" noOfLines={2}>
              {teaser}
            </Text>
            <Flex
              mt={5}
              mx="auto"
              w="46px"
              h="46px"
              borderRadius="full"
              align="center"
              justify="center"
              bg="brand.500"
              color="noir.800"
              transition="transform 500ms var(--dy-ease)"
              _groupHover={{ transform: 'translateX(-4px)' }}
            >
              <ArrowLeft size={19} />
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

/**
 * 2 · Collections. The categories as a row of vitrine niches — the arch from
 * the hero, now holding the house's photography.
 */
export function HomeCollections() {
  const { t } = useTranslation();
  const { index, isLoading } = useMenuIndex();
  const [active, setActive] = useState(0);
  const categories = index.categories;
  const odd = categories.length % 2 === 1;

  if (!isLoading && categories.length === 0) return null;

  return (
    <HomeSection id="home-collections" surface="ivory" aria-labelledby="home-collections-title">
      <Container maxW={CONTAINER_W}>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'flex-end' }} justify="space-between" gap={6}>
          <Box maxW="680px">
            <SectionMarker index={1} label={COPY.collections.marker} />
            <RevealWords id="home-collections-title" as="h2" text={COPY.collections.title} mt={{ base: 5, md: 6 }} {...TYPE.title} />
            <RevealWords text={COPY.collections.sub} delay={0.25} mt={{ base: 3, md: 4 }} color="text.muted" {...TYPE.lead} />
          </Box>
          <Button
            as={RouterLink}
            to="/menu"
            variant="outlineInk"
            h="48px"
            px={6}
            alignSelf={{ base: 'flex-start', md: 'auto' }}
            rightIcon={<ArrowLeft size={17} />}
            display={{ base: 'none', md: 'inline-flex' }}
          >
            {t('home.viewAll')}
          </Button>
        </Flex>

        <Box
          as={motion.div}
          mt={{ base: 10, md: 14 }}
          display={{ base: 'grid', lg: 'flex' }}
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          gap={{ base: 3, sm: 4, lg: 4, xl: 5 }}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          onMouseLeave={() => setActive(0)}
        >
          {isLoading
            ? [0, 1, 2, 3].map((i) => (
                <Box key={i} flex={{ lg: 1 }} className="dy-shimmer" borderRadius={ARCH_RADIUS} h={PANEL_H} sx={{ aspectRatio: { base: '3 / 4', lg: 'auto' } }} />
              ))
            : categories.map((category, i) => (
                <Niche
                  key={category.id}
                  category={category}
                  products={index.byCategory.get(category.id) ?? []}
                  index={i}
                  active={active === i}
                  wide={odd && i === 0}
                  onActivate={() => setActive(i)}
                />
              ))}
        </Box>

        <Button
          as={RouterLink}
          to="/menu"
          variant="noir"
          mt={8}
          h="52px"
          w="100%"
          rightIcon={<ArrowLeft size={17} />}
          display={{ base: 'inline-flex', md: 'none' }}
        >
          {t('home.viewAll')}
        </Button>
      </Container>
    </HomeSection>
  );
}

export default HomeCollections;
