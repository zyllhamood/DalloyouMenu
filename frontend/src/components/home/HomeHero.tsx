import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { Box, Button, Container, Flex, HStack, Text, VisuallyHidden } from '@chakra-ui/react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Price from '../product/Price';
import ProductImage from '../product/ProductImage';
import type { Product } from '../../lib/api';
import { productImageSource } from '../../lib/images';
import { categoryName, displayName, measurementText, useMenuIndex } from '../../lib/menu';
import { effectivePrice, originalPrice } from '../../lib/price';
import { useModalLinkState } from '../../lib/routing';
import { COPY } from './content';
import { CONTAINER_W, DUR, EASE } from './tokens';
import { pickVaried, useLooks, type Look, type RGB, type Studio } from '../../hooks/useLooks';
import { heroCandidates } from './heroCandidates';
import RevealWords from './RevealWords';

const INTERVAL_MS = 6000;
const PALETTE_MS = 800;
const IVORY: { wall: RGB; table: RGB } = { wall: [236, 228, 211], table: [246, 241, 231] };
const SIZES = '(min-width: 62em) 600px, 100vw';

/** A look with its page colours: a studio brings its own, the others sit on ivory. */
interface Slide {
  product: Product;
  kind: Look['kind'];
  wall: RGB;
  table: RGB;
  horizon: number;
}

const toSlide = (look: Look): Slide =>
  look.kind === 'studio' ? look : { product: look.product, kind: look.kind, ...IVORY, horizon: 0.62 };

const rgb = (c: RGB) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const shade = (c: RGB, k: number): RGB => [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)];

/** Font size that sets `text` in Amiri bold at `width` px wide (measured, once fonts are in). */
function useFitSize(text: string, width: number, min: number, max: number) {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void document.fonts?.ready.then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(() => {
    if (!text || !width) return min;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return min;
    ctx.font = `700 100px Amiri, 'Times New Roman', serif`;
    const measured = ctx.measureText(text).width || 1;
    return Math.max(min, Math.min(max, (width / measured) * 100));
    // fontsReady re-measures once the real face is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, width, min, max, fontsReady]);
}

/**
 * 1 · The Studio. The house photographs its pieces in a two-tone studio (a
 * pastel wall, a lighter table); the hero carries that studio across the
 * whole screen. Each piece takes over the page with its own colours — the
 * wall becomes the background, the table runs out to both edges at the
 * photo's own horizon — so the cake appears to stand in a room the size of
 * the screen. Its name is set large on the wall behind it. Pieces change on
 * their own (or by swipe / thumbnail). Nothing is pinned: scrolling simply
 * carries on into the page.
 */
export function HomeHero() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const linkState = useModalLinkState();
  const { index } = useMenuIndex();
  const { products: candidates, featured } = useMemo(() => heroCandidates(index), [index]);
  const { looks, settled } = useLooks(candidates);

  const slides: Slide[] = useMemo(() => {
    if (featured) {
      // All of the featured, in order — each joins as soon as its photo has been read.
      const ready: Slide[] = [];
      for (const look of looks) {
        if (!look) break;
        ready.push(toSlide(look));
      }
      return ready;
    }
    if (!settled) return [];
    // Choosing for itself: prefer the studio shots, in varied colours.
    const studios = looks.filter((l): l is Studio => l?.kind === 'studio');
    return studios.length ? pickVaried(studios, 6).map(toSlide) : looks.slice(0, 5).map((l) => toSlide(l as Look));
  }, [featured, looks, settled]);

  const [active, setActive] = useState(0);
  const [tabHidden, setTabHidden] = useState(false);
  const [play, setPlay] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const count = slides.length;
  const slide = count ? slides[active % count] : undefined;
  // Same rhythm on every screen: it only rests while off screen or in a background tab.
  const paused = count < 2 || tabHidden || !inView || Boolean(reduce);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPlay(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, count]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // The likely first piece: fetch its photo while its studio is still being read.
  const lead = candidates[0];
  useEffect(() => {
    const source = lead && productImageSource(lead, 'display');
    if (!source) return;
    const img = new Image();
    img.sizes = SIZES;
    if (source.srcSet) img.srcset = source.srcSet;
    img.src = source.src;
  }, [lead]);

  // Warm the next photo so each change lands at once.
  useEffect(() => {
    if (count < 2) return;
    const next = productImageSource(slides[(active + 1) % count].product, 'display');
    if (!next) return;
    const img = new Image();
    img.sizes = SIZES;
    if (next.srcSet) img.srcset = next.srcSet;
    img.src = next.src;
  }, [active, slides, count]);

  const step = (direction: 1 | -1) => count && setActive((i) => (i + direction + count) % count);

  // ── Width, for fitting the big name ────────────────────────────────────
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const wide = width >= 992;
  const name = slide ? displayName(slide.product) : '';
  // On desktop the name also keeps clear of the navbar on short screens.
  const nameSize = useFitSize(name, wide ? Math.min(width * 0.56, 820) : width * 0.86, wide ? 64 : 34, wide ? Math.min(150, height * 0.16) : 72);

  // ── Motion: scroll and pointer ─────────────────────────────────────────
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const nameScrollY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.25]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const photoX = useTransform(sx, (v) => v * -10);
  const photoY = useTransform(sy, (v) => v * -6);
  const nameX = useTransform(sx, (v) => v * 16);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  // ── Swipe (touch) ───────────────────────────────────────────────────────
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onStageDown = (event: PointerEvent) => {
    swipe.current = { x: event.clientX, y: event.clientY };
    swiped.current = false;
  };
  const onStageUp = (event: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || count < 2) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.2) {
      swiped.current = true;
      step(dx > 0 ? 1 : -1); // RTL: a swipe to the right brings the next piece
    }
  };
  const onStageClick = (event: MouseEvent) => {
    if (swiped.current) {
      event.preventDefault();
      swiped.current = false;
    }
  };

  const wall = slide?.wall ?? IVORY.wall;
  const table = slide?.table ?? IVORY.table;
  const horizon = slide?.horizon ?? 0.62;
  const measure = slide ? measurementText(slide.product, t) : '';
  const colorEase = `${PALETTE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 14 },
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: DUR.base, ease: EASE, delay },
  });

  return (
    <Box
      ref={sectionRef}
      as="section"
      data-nav-theme="light"
      aria-roledescription="carousel"
      aria-label={COPY.hero.carousel}
      position="relative"
      zIndex={0}
      overflow="hidden"
      h="100svh"
      minH={{ base: '640px', lg: '660px' }}
      bg={rgb(wall)}
      color="text.primary"
      transition={`background-color ${colorEase}`}
      onPointerMove={onPointerMove}
      onMouseLeave={() => {
        px.set(0);
        py.set(0);
      }}
      sx={{
        // Photo size and the space kept below it.
        '--s': { base: 'min(100vw, 47svh)', md: 'min(74vw, 50svh)', lg: 'min(60vh, 580px)' },
        '--sb': { base: '190px', md: '210px', lg: 'calc(48px + 5vh)' },
        '--h': String(horizon),
      }}
    >
      {/* ── The table, carried to both edges at the photo's horizon ── */}
      <Box
        position="absolute"
        insetInline={0}
        bottom={0}
        top="calc(100% - var(--sb) - var(--s) + var(--s) * var(--h))"
        bg={rgb(table)}
        transition={`top ${colorEase}, background-color ${colorEase}`}
        aria-hidden
      />

      {/* ── The piece's name, large, on the wall ── */}
      <motion.div
        style={{ position: 'absolute', insetInline: 0, bottom: 'calc(var(--sb) + var(--s) * 0.9)', y: nameScrollY, x: nameX, opacity: fade }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {slide && (
            <motion.p
              key={slide.product.id}
              aria-hidden
              initial={{ opacity: 0, y: reduce ? 0 : 36 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE, delay: 0.12 } }}
              exit={{ opacity: 0, y: reduce ? 0 : -24, transition: { duration: 0.45, ease: EASE } }}
              style={{
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: `${nameSize}px`,
                lineHeight: 1.25,
                color: rgb(shade(wall, 0.6)),
                transition: `color ${colorEase}`,
              }}
            >
              {name}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── The stage: the photo, feathered into its own studio ── */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 'var(--sb)',
          width: 'var(--s)',
          height: 'var(--s)',
          marginLeft: 'calc(var(--s) / -2)',
          y: stageY,
        }}
      >
        <motion.div style={{ position: 'absolute', inset: 0, x: photoX, y: photoY }}>
          <Box
            as={RouterLink}
            to={slide ? `/product/${slide.product.id}` : '/menu'}
            state={linkState}
            aria-label={slide ? t('product.view', { name }) : t('nav.menu')}
            onPointerDown={onStageDown}
            onPointerUp={onStageUp}
            onClick={onStageClick}
            position="absolute"
            inset={0}
            display="block"
            overflow={slide?.kind === 'framed' ? 'hidden' : undefined}
            borderRadius={slide?.kind === 'framed' ? { base: '24px', lg: '32px' } : undefined}
            boxShadow={slide?.kind === 'framed' ? '0 40px 80px -40px rgba(62, 38, 14, 0.55)' : undefined}
            transition="border-radius 400ms, box-shadow 600ms"
            sx={{
              touchAction: 'pan-y',
              ...(slide?.kind !== 'studio'
                ? {}
                : {
                    // Feather every edge so the photo's backdrop melts into the page.
                    WebkitMaskImage:
                      'linear-gradient(to right, transparent 0%, #000 13%, #000 87%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 11%, #000 91%, transparent 100%)',
                    maskImage:
                      'linear-gradient(to right, transparent 0%, #000 13%, #000 87%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 11%, #000 91%, transparent 100%)',
                    WebkitMaskComposite: 'source-in',
                    maskComposite: 'intersect',
                  }),
            }}
          >
            <AnimatePresence initial={false}>
              {slide && (
                <motion.div
                  key={slide.product.id}
                  style={{ position: 'absolute', inset: 0 }}
                  initial={{ opacity: 0, y: reduce ? 0 : '6%', scale: reduce ? 1 : 0.95 }}
                  // The studio colours change first; the new piece arrives into them.
                  // (Transform and opacity only — cheap to composite even at full laptop size.)
                  animate={{ opacity: 1, y: '0%', scale: 1, transition: { duration: 0.9, ease: EASE, delay: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE } }}
                >
                  <ProductImage product={slide.product} sizes={SIZES} eager style={{ position: 'absolute', inset: 0 }} />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </motion.div>

      {/* ── Copy ── */}
      <Container maxW={CONTAINER_W} position="relative" h="100%">
        {/* The house line: above the stage on phones, beside it on desktop */}
        <motion.div style={{ y: copyY, opacity: fade }}>
          <Box
            position="absolute"
            insetInlineStart={{ base: 0, lg: 10 }}
            insetInlineEnd={{ base: 0, lg: 'auto' }}
            top={{ base: 'calc(var(--dy-nav-h) + 14px)', lg: 'calc(100% - var(--sb) - var(--s) * 0.72)' }}
            // Never wider than the space beside the photo.
            w={{ lg: 'min(340px, calc((100vw - var(--s)) / 2 - 64px))' }}
            px={{ base: 5, md: 10, lg: 0 }}
            textAlign={{ base: 'center', lg: 'start' }}
          >
            <motion.div {...fadeUp(0.15)}>
              <Text
                display={{ base: 'none', lg: 'block' }}
                lang="en"
                dir="ltr"
                textAlign="right"
                fontFamily="latin"
                fontSize="10.5px"
                letterSpacing="0.2em"
                textTransform="uppercase"
                color="rgba(22, 18, 14, 0.62)"
                mb={5}
              >
                {COPY.hero.eyebrow}
              </Text>
            </motion.div>
            {/* The page's heading says what and where for search; the house line is shown. */}
            <VisuallyHidden as="h1">{t('seo.homeHeading')}</VisuallyHidden>
            <RevealWords
              as="p"
              text={`${t('hero.line1')}\n${t('hero.line2')}`}
              lineBreak={{ base: 'none', lg: 'inline' }}
              play={play}
              delay={0.2}
              fontFamily="display"
              fontWeight={700}
              fontSize={{ base: '27px', sm: '32px', lg: '50px', xl: '58px' }}
              lineHeight={{ base: 1.35, lg: 1.3 }}
              color="noir.800"
            />
            <motion.div {...fadeUp(0.55)}>
              <Text display={{ base: 'none', lg: 'block' }} mt={4} fontSize="16px" lineHeight={1.85} color="rgba(22, 18, 14, 0.7)">
                {COPY.hero.sub}
              </Text>
              <Button
                as={RouterLink}
                to="/menu"
                variant="noir"
                display={{ base: 'none', lg: 'inline-flex' }}
                mt={8}
                h="54px"
                px={8}
                rightIcon={<ArrowLeft size={18} />}
              >
                {t('hero.ctaMenu')}
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {/* The piece on show: details, the way to order it, and the others */}
        <motion.div {...fadeUp(0.75)}>
          <Box
            position="absolute"
            insetInlineEnd={{ base: 0, lg: 10 }}
            insetInlineStart={{ base: 0, lg: 'auto' }}
            bottom={{ base: '56px', md: '64px', lg: 'var(--sb)' }}
            w={{ lg: 'min(340px, calc((100vw - var(--s)) / 2 - 64px))' }}
            px={{ base: 5, md: 10, lg: 0 }}
          >
            <Box aria-live="polite" minH={{ lg: '64px' }}>
              <VisuallyHidden>{name}</VisuallyHidden>
              <AnimatePresence mode="wait" initial={false}>
                {slide && (
                  <motion.div
                    key={slide.product.id}
                    initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: 0.2 } }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  >
                    <Flex
                      direction={{ base: 'row', lg: 'column' }}
                      align={{ base: 'center', lg: 'flex-start' }}
                      justify={{ base: 'center', lg: 'flex-start' }}
                      gap={{ base: 3, lg: 1 }}
                    >
                      <Text fontSize={{ base: '13px', lg: '13.5px' }} fontWeight={600} color="rgba(22, 18, 14, 0.62)">
                        {categoryName(slide.product.category)}
                        {measure ? ` · ${measure}` : ''}
                      </Text>
                      <Price value={effectivePrice(slide.product)} original={originalPrice(slide.product)} size="md" tone="ink" />
                    </Flex>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            <HStack mt={{ base: 3, lg: 5 }} spacing={3} justify={{ base: 'center', lg: 'flex-start' }}>
              <Button
                variant="noir"
                h={{ base: '48px', lg: '50px' }}
                px={{ base: 5, lg: 6 }}
                flex={{ base: 1, sm: 'none' }}
                maxW={{ base: '200px', sm: 'none' }}
                isDisabled={!slide}
                onClick={() => slide && navigate(`/product/${slide.product.id}`, { state: linkState })}
              >
                {COPY.hero.orderPiece}
              </Button>
              <Button
                as={RouterLink}
                to="/menu"
                variant="outlineInk"
                display={{ base: 'inline-flex', lg: 'none' }}
                h="48px"
                px={5}
                flex={{ base: 1, sm: 'none' }}
                maxW={{ base: '150px', sm: 'none' }}
                borderColor="rgba(22, 18, 14, 0.3)"
              >
                {t('nav.menu')}
              </Button>
            </HStack>

            {count > 1 && (
              <>
                {/* Desktop: the pieces as thumbnails, the current one ringed by its timer */}
                <HStack mt={7} spacing={2} flexWrap="wrap" display={{ base: 'none', lg: 'flex' }} role="tablist" aria-label={COPY.hero.carousel}>
                  {slides.map((s, i) => {
                    const current = i === active % count;
                    return (
                      <Box
                        key={s.product.id}
                        as="button"
                        type="button"
                        role="tab"
                        aria-selected={current}
                        aria-label={displayName(s.product)}
                        onClick={() => setActive(i)}
                        position="relative"
                        w="44px"
                        h="44px"
                        flexShrink={0}
                        borderRadius="full"
                        transition="transform 400ms var(--dy-ease)"
                        _hover={{ transform: 'translateY(-2px)' }}
                      >
                        <Box position="absolute" inset="4px" borderRadius="full" overflow="hidden" bg={s.kind === 'studio' ? rgb(s.wall) : 'ivory.300'} opacity={current ? 1 : 0.7}>
                          <ProductImage product={s.product} sizes="44px" widths={[160]} style={{ position: 'absolute', inset: 0, transform: 'scale(1.35)' }} />
                        </Box>
                        <svg viewBox="0 0 50 50" width="44" height="44" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden>
                          <circle cx="25" cy="25" r="24" fill="none" stroke="rgba(22,18,14,0.14)" strokeWidth="1" />
                          {current && (
                            <motion.circle
                              key={`${active}-${paused ? 'p' : 'r'}`}
                              cx="25"
                              cy="25"
                              r="24"
                              fill="none"
                              stroke="#16120E"
                              strokeWidth="1.5"
                              initial={{ pathLength: paused ? 1 : 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: paused ? 0 : INTERVAL_MS / 1000, ease: 'linear' }}
                            />
                          )}
                        </svg>
                      </Box>
                    );
                  })}
                </HStack>

                {/* Phones: thin timers */}
                <HStack mt={4} spacing={1.5} justify="center" display={{ base: 'flex', lg: 'none' }}>
                  {slides.map((s, i) => {
                    const current = i === active % count;
                    return (
                      <Box
                        key={s.product.id}
                        as="button"
                        type="button"
                        aria-label={displayName(s.product)}
                        aria-current={current ? 'true' : undefined}
                        onClick={() => setActive(i)}
                        w={current ? '30px' : '14px'}
                        h="16px"
                        display="grid"
                        alignItems="center"
                        transition="width 500ms var(--dy-ease)"
                      >
                        <Box h="2px" borderRadius="full" bg="rgba(22, 18, 14, 0.18)" overflow="hidden">
                          {current && (
                            <Box
                              key={`${active}-${paused ? 'p' : 'r'}`}
                              h="100%"
                              bg="noir.800"
                              transformOrigin="right"
                              sx={paused ? { transform: 'scaleX(1)' } : { animation: `dy-fill ${INTERVAL_MS}ms linear forwards` }}
                            />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </HStack>
              </>
            )}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

export default HomeHero;
