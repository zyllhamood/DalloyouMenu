import { Box, Container, Flex, Text } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PhotoFrame, { FrameSheen } from '../product/PhotoFrame';
import ProductImage from '../product/ProductImage';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';
import type { MenuCategory, Product } from '../../lib/api';
import { categoryName, useMenuIndex } from '../../lib/menu';

function CategoryTile({ category, products, index }: { category: MenuCategory; products: Product[]; index: number }) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const cover = products.find((p) => p.is_featured) ?? products[0];
  const name = categoryName(category);

  return (
    <Reveal delay={index * 0.1}>
      <Box
        as={RouterLink}
        to={`/menu/${category.slug}`}
        display="block"
        role="group"
        aria-label={`${name} — ${t('menu.items', { count: products.length })}`}
        sx={{
          '.dy-cat-frame': {
            boxShadow: '0 26px 50px -34px rgba(62, 38, 14, 0.6)',
            transition: 'transform 500ms var(--dy-ease), box-shadow 700ms var(--dy-ease)',
          },
          '.dy-cat-sheen': { transition: 'transform 1200ms var(--dy-ease)' },
          '.dy-cat-arrow': { transition: 'background-color 400ms, color 400ms, border-color 400ms, transform 500ms var(--dy-ease)' },
          '&:active .dy-cat-frame': { transform: 'scale(0.985)' },
          '@media (hover: hover)': {
            '&:hover .dy-cat-frame': { boxShadow: '0 34px 60px -34px rgba(62, 38, 14, 0.7)' },
            '&:hover .dy-cat-img': { transform: 'scale(1.06)' },
            '&:hover .dy-cat-sheen': { transform: 'translateX(-110%)' },
            '&:hover .dy-cat-arrow': {
              bg: 'brand.500',
              borderColor: 'brand.500',
              color: 'noir.800',
              transform: rtl ? 'translateX(-4px)' : 'translateX(4px)',
            },
          },
        }}
      >
        <PhotoFrame className="dy-cat-frame" radius={{ base: '22px', md: '28px' }}>
          {cover && (
            <ProductImage
              product={cover}
              className="dy-cat-img"
              sizes="(min-width: 62em) 400px, (min-width: 30em) 45vw, 74vw"
              style={{ position: 'absolute', inset: 0 }}
            />
          )}
          <FrameSheen className="dy-cat-sheen" />

          {/* Name over a soft dusk at the foot of the photo */}
          <Flex
            position="absolute"
            insetInline={0}
            bottom={0}
            zIndex={2}
            align="flex-end"
            justify="space-between"
            gap={4}
            px={{ base: 5, md: 6 }}
            pb={{ base: 5, md: 6 }}
            pt={20}
            color="text.onDark"
            sx={{ background: 'linear-gradient(180deg, rgba(14,11,8,0) 0%, rgba(14,11,8,0.5) 45%, rgba(14,11,8,0.82) 100%)' }}
          >
            <Box minW={0}>
              {/* Wraps rather than truncating — a category name is never cut. */}
              <Text
                fontFamily="display"
                fontWeight={700}
                fontSize={{ base: '30px', md: '26px', lg: '32px', xl: '36px' }}
                lineHeight={1.3}
              >
                {name}
              </Text>
              <Text mt={1} fontSize="14px" color="rgba(244, 238, 227, 0.78)">
                {t('menu.items', { count: products.length })}
              </Text>
            </Box>
            <Box
              className="dy-cat-arrow"
              display="grid"
              placeItems="center"
              flexShrink={0}
              w={{ base: '48px', md: '42px', lg: '48px' }}
              h={{ base: '48px', md: '42px', lg: '48px' }}
              borderRadius="full"
              border="1px solid rgba(244, 238, 227, 0.4)"
              bg="rgba(14, 11, 8, 0.25)"
              backdropFilter="blur(6px)"
              color="text.onDark"
            >
              {rtl ? <ArrowLeft size={19} /> : <ArrowRight size={19} />}
            </Box>
          </Flex>
        </PhotoFrame>
      </Box>
    </Reveal>
  );
}

/** One photo per category — its signature piece — as a door into that part of the menu. */
export function CategoryShowcase() {
  const { t } = useTranslation();
  const { index, isLoading } = useMenuIndex();

  if (!isLoading && index.categories.length === 0) return null;
  const columns = Math.min(Math.max(index.categories.length, 1), 3);

  return (
    <Box as="section" data-nav-theme="light" py={{ base: 20, md: 28, xl: 32 }} aria-labelledby="home-categories">
      <Container maxW="1320px">
        <SectionHeader
          headingId="home-categories"
          eyebrow={t('home.categoriesEyebrow')}
          title={t('home.categoriesTitle')}
          subtitle={t('home.categoriesSubtitle')}
        />

        <Box
          mt={{ base: 10, md: 14 }}
          className="dy-no-scrollbar"
          display="grid"
          gridAutoFlow={{ base: 'column', md: 'row' }}
          gridAutoColumns={{ base: '74%', sm: '46%' }}
          gridTemplateColumns={{ md: `repeat(${columns}, minmax(0, 1fr))` }}
          gap={{ base: 4, md: 8, xl: 10 }}
          overflowX={{ base: 'auto', md: 'visible' }}
          mx={{ base: -5, md: 0 }}
          px={{ base: 5, md: 0 }}
          pb={{ base: 2, md: 0 }}
          sx={{ scrollSnapType: { base: 'x mandatory', md: 'none' }, scrollPaddingInline: { base: '20px', md: 0 } }}
        >
          {isLoading
            ? [0, 1, 2].map((i) => (
                <Box key={i}>
                  <Box className="dy-shimmer" borderRadius={{ base: '22px', md: '28px' }} sx={{ aspectRatio: '1 / 1' }} />
                </Box>
              ))
            : index.categories.map((category, i) => (
                <Box key={category.id} sx={{ scrollSnapAlign: 'start' }}>
                  <CategoryTile category={category} products={index.byCategory.get(category.id) ?? []} index={i} />
                </Box>
              ))}
        </Box>
      </Container>
    </Box>
  );
}

export default CategoryShowcase;
