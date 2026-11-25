import { Fragment, useMemo, useRef, type ReactNode } from 'react';
import { Box, Container, Flex, HStack, Link, Text } from '@chakra-ui/react';
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Monogram from '../brand/Monogram';
import { SocialGlyph } from '../icons/SocialIcons';
import ProductImage from '../product/ProductImage';
import { SOCIALS } from '../../config/links';
import type { Product } from '../../lib/api';
import { categoryName, displayName, useMenuIndex } from '../../lib/menu';
import { useModalLinkState } from '../../lib/routing';
import { COPY } from './content';
import { CONTAINER_W, TYPE } from './tokens';
import HomeSection from './HomeSection';
import RevealWords from './RevealWords';
import SectionMarker from './SectionMarker';

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/**
 * A ribbon that drifts on its own and answers the scroll: scrolling faster
 * speeds it up, scrolling back turns it around. The content is repeated so
 * the loop is seamless; it rests while off screen.
 *
 * (The "scroll velocity" ribbon popularised by component kits, rebuilt here
 * on Framer Motion's primitives and Chakra.)
 */
function VelocityRibbon({ children, speed, copies = 4 }: { children: ReactNode; speed: number; copies?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '20% 0px 20% 0px' });
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-1200, 0, 1200], [-4, 0, 4], { clamp: false });
  const direction = useRef(1);
  const share = 100 / copies;
  const x = useTransform(base, (v) => `${wrap(-share, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (!visible || reduce) return;
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    let move = direction.current * speed * (delta / 1000);
    move += direction.current * Math.abs(move) * Math.abs(b) * Math.sign(speed);
    base.set(base.get() + move);
  });

  return (
    <Box ref={ref} overflow="hidden" dir="ltr">
      <motion.div style={{ x, display: 'flex', width: 'max-content' }}>
        {Array.from({ length: copies }, (_, i) => (
          <Flex key={i} flexShrink={0} aria-hidden={i > 0 || undefined}>
            {children}
          </Flex>
        ))}
      </motion.div>
    </Box>
  );
}

function Tile({ product, tall }: { product: Product; tall: boolean }) {
  const { t } = useTranslation();
  const linkState = useModalLinkState();
  const name = displayName(product);
  return (
    <Box
      as={RouterLink}
      to={`/product/${product.id}`}
      state={linkState}
      aria-label={t('product.view', { name })}
      role="group"
      position="relative"
      display="block"
      flexShrink={0}
      w={tall ? { base: '170px', md: '260px' } : { base: '210px', md: '330px' }}
      h={{ base: '220px', md: '340px' }}
      mx={{ base: 1.5, md: 2.5 }}
      overflow="hidden"
      borderRadius={tall ? '999px 999px 20px 20px' : { base: '20px', md: '28px' }}
      bg="ivory.300"
      draggable={false}
      sx={{
        '.dy-tile-img': { transition: 'transform 1200ms var(--dy-ease)' },
        '@media (hover: hover)': { '&:hover .dy-tile-img': { transform: 'scale(1.07)' } },
      }}
    >
      <ProductImage
        product={product}
        kind="styled"
        className="dy-tile-img"
        sizes="(min-width: 48em) 330px, 210px"
        widths={[320, 640]}
        style={{ position: 'absolute', inset: 0 }}
      />
      <Box
        position="absolute"
        insetInline={0}
        bottom={0}
        p={4}
        pt={12}
        dir="rtl"
        color="text.onDark"
        opacity={0}
        transform="translateY(8px)"
        transition="opacity 500ms, transform 500ms var(--dy-ease)"
        _groupHover={{ opacity: 1, transform: 'translateY(0)' }}
        _groupFocusVisible={{ opacity: 1, transform: 'translateY(0)' }}
        sx={{ background: 'linear-gradient(180deg, rgba(14,11,8,0) 0%, rgba(14,11,8,0.75) 100%)' }}
      >
        <Text fontFamily="display" fontWeight={700} fontSize={{ base: '16px', md: '19px' }} noOfLines={1} pb="0.2em" mb="-0.2em">
          {name}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * 6 · Gallery. The house's photography as two drifting ribbons with a line
 * of words between them — moving with the reader, in both directions.
 */
export function HomeGallery() {
  const { t } = useTranslation();
  const { index } = useMenuIndex();

  const photos = useMemo(() => {
    const seen = new Set<number>();
    return [...index.featured, ...index.fresh, ...index.products]
      .filter((p) => {
        if ((!p.styled_image && !p.display_image) || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .slice(0, 16);
  }, [index]);

  if (photos.length < 4) return null;

  const half = Math.ceil(photos.length / 2);
  const rowA = photos.slice(0, half);
  const rowB = photos.slice(half);
  const phrases = [t('marquee.crafted'), ...index.categories.map(categoryName), t('marquee.served'), t('marquee.fresh')];

  return (
    <HomeSection surface="ivory" overflow="hidden" aria-labelledby="home-gallery-title">
      <Container maxW={CONTAINER_W}>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'flex-end' }} justify="space-between" gap={6}>
          <Box>
            <SectionMarker index={4} label={COPY.gallery.marker} />
            <RevealWords id="home-gallery-title" as="h2" text={t('home.worldTitle')} mt={{ base: 5, md: 6 }} {...TYPE.title} />
          </Box>
          <HStack spacing={2}>
            {SOCIALS.map((social) => (
              <Link
                key={social.key}
                href={social.url}
                isExternal
                display="inline-flex"
                alignItems="center"
                gap={2}
                h="46px"
                px={{ base: 4, md: 5 }}
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
        </Flex>
      </Container>

      <Box mt={{ base: 12, md: 16 }} display="flex" flexDirection="column" gap={{ base: 3, md: 5 }}>
        <VelocityRibbon speed={-2.2}>
          {rowA.map((p, i) => (
            <Tile key={p.id} product={p} tall={i % 3 === 1} />
          ))}
        </VelocityRibbon>

        <VelocityRibbon speed={1.6} copies={4}>
          <Flex align="center" py={{ base: 2, md: 3 }} dir="rtl">
            {phrases.map((phrase, i) => (
              <Fragment key={`${phrase}-${i}`}>
                <Text
                  as="span"
                  px={{ base: 5, md: 9 }}
                  fontFamily="display"
                  fontWeight={700}
                  fontSize={{ base: '28px', md: '46px' }}
                  lineHeight={1.6}
                  whiteSpace="nowrap"
                  className={i % 2 === 0 ? 'dy-metal-text' : undefined}
                  color={i % 2 === 0 ? undefined : 'text.primary'}
                >
                  {phrase}
                </Text>
                <Monogram w={{ base: '18px', md: '24px' }} h={{ base: '18px', md: '24px' }} opacity={0.8} />
              </Fragment>
            ))}
          </Flex>
        </VelocityRibbon>

        <VelocityRibbon speed={-1.8}>
          {(rowB.length >= 2 ? rowB : rowA).map((p, i) => (
            <Tile key={p.id} product={p} tall={i % 3 === 0} />
          ))}
        </VelocityRibbon>
      </Box>
    </HomeSection>
  );
}

export default HomeGallery;
