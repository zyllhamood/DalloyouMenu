import { useMemo, useRef } from 'react';
import { Box, Container, HStack, Link, Text, useMediaQuery } from '@chakra-ui/react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { SocialGlyph } from '../icons/SocialIcons';
import PhotoFrame from '../product/PhotoFrame';
import ProductImage from '../product/ProductImage';
import SectionHeader from '../ui/SectionHeader';
import { SOCIALS } from '../../config/links';
import type { Product } from '../../lib/api';
import { displayName, useMenuIndex } from '../../lib/menu';
import { useModalLinkState } from '../../lib/routing';

function Photo({ product, drift, progress }: { product: Product; drift: number; progress: MotionValue<number> }) {
  const linkState = useModalLinkState();
  const { t } = useTranslation();
  const y = useTransform(progress, [0, 1], [drift, -drift]);
  const name = displayName(product);

  return (
    <motion.div style={{ y }}>
      <Box
        as={RouterLink}
        to={`/product/${product.id}`}
        state={linkState}
        aria-label={t('product.view', { name })}
        display="block"
        role="group"
        sx={{
          '.dy-world-frame': { boxShadow: '0 26px 50px -34px rgba(62, 38, 14, 0.55)' },
          '@media (hover: hover)': { '&:hover .dy-world-img': { transform: 'scale(1.06)' } },
        }}
      >
        <PhotoFrame className="dy-world-frame" radius={{ base: '20px', md: '24px' }}>
          <ProductImage
            product={product}
            kind="styled"
            className="dy-world-img"
            sizes="(min-width: 62em) 22vw, 58vw"
            widths={[320, 640, 960]}
            style={{ position: 'absolute', inset: 0 }}
          />
          <Box
            position="absolute"
            insetInline={0}
            bottom={0}
            zIndex={2}
            p={4}
            pt={12}
            color="text.onDark"
            sx={{ background: 'linear-gradient(180deg, rgba(14,11,8,0) 0%, rgba(14,11,8,0.72) 100%)' }}
            opacity={{ base: 1, lg: 0 }}
            transform={{ lg: 'translateY(8px)' }}
            transition="opacity 500ms, transform 500ms var(--dy-ease)"
            _groupHover={{ opacity: 1, transform: 'translateY(0)' }}
          >
            <Text
              fontFamily="display"
              fontWeight={700}
              fontSize={{ base: '17px', md: '19px' }}
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              pb="0.3em"
              mb="-0.3em"
            >
              {name}
            </Text>
          </Box>
        </PhotoFrame>
      </Box>
    </motion.div>
  );
}

/** The house's photography as a social-feed teaser, drifting at different speeds. */
export function WorldGallery() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [isDesktop] = useMediaQuery('(min-width: 62em)', { ssr: false });
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const { index } = useMenuIndex();

  const photos = useMemo(() => {
    const seen = new Set<number>();
    return [...index.featured, ...index.fresh, ...index.products]
      .filter((p) => {
        if ((!p.styled_image && !p.display_image) || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .slice(0, 6);
  }, [index]);

  if (photos.length < 3) return null;

  const drifts = [36, -24, 52, -40, 28, -32];
  const shown = photos.slice(0, 5);

  return (
    <Box as="section" data-nav-theme="light" py={{ base: 20, md: 28, xl: 32 }} overflow="hidden" aria-labelledby="home-world">
      <Container maxW="1320px">
        <SectionHeader
          headingId="home-world"
          eyebrow={t('home.worldEyebrow')}
          title={t('home.worldTitle')}
          action={
            <HStack spacing={2}>
              {SOCIALS.map((social) => (
                <Link
                  key={social.key}
                  href={social.url}
                  isExternal
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  h="44px"
                  px={4}
                  borderRadius="full"
                  border="1px solid rgba(22, 18, 14, 0.14)"
                  fontSize="14px"
                  fontWeight={500}
                  transition="all 300ms var(--dy-ease)"
                  _hover={{ bg: 'noir.800', color: 'brand.100', borderColor: 'noir.800', textDecoration: 'none' }}
                >
                  <SocialGlyph network={social.key} size={17} />
                  <Box as="span" display={{ base: 'none', sm: 'inline' }}>
                    {t(`social.${social.key}`)}
                  </Box>
                </Link>
              ))}
            </HStack>
          }
        />
      </Container>

      <Container maxW="1320px" px={{ base: 0, lg: 10 }}>
        <Box
          ref={ref}
          mt={{ base: 12, md: 16 }}
          className="dy-no-scrollbar"
          display="grid"
          gridAutoFlow={{ base: 'column', lg: 'row' }}
          gridAutoColumns={{ base: '58%', sm: '38%' }}
          gridTemplateColumns={{ lg: `repeat(${shown.length}, minmax(0, 1fr))` }}
          gap={{ base: 3.5, md: 6 }}
          overflowX={{ base: 'auto', lg: 'visible' }}
          px={{ base: 5, lg: 0 }}
          py={{ base: 2, lg: 14 }}
          sx={{ scrollSnapType: { base: 'x mandatory', lg: 'none' }, scrollPaddingInline: '20px' }}
        >
          {shown.map((product, i) => (
            <Box key={product.id} sx={{ scrollSnapAlign: 'start' }} mt={{ lg: i % 2 ? '56px' : 0 }}>
              <Photo product={product} drift={reduce || !isDesktop ? 0 : drifts[i]} progress={scrollYProgress} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default WorldGallery;
