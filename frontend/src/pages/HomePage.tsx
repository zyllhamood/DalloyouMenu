import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import HomeHero from '../components/HomeHero';
import ProductsGrid from '../components/ProductsGrid';
import SectionHeading from '../components/SectionHeading';
import { categoriesList, featuredProducts, productsList } from '../lib/api';
import { localized } from '../lib/format';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;

const STORY_IMAGE =
  'https://placehold.co/800x900/FAF8F3/C9A961?text=Dalloyou&font=cormorant';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const featured = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: featuredProducts,
    ...QUERY_OPTS,
  });

  const categories = useQuery({
    queryKey: ['categoriesList'],
    queryFn: categoriesList,
    ...QUERY_OPTS,
  });

  const newArrivals = useQuery({
    queryKey: ['productsList', { isNew: true, limit: 8 }],
    queryFn: () => productsList({ isNew: true, limit: 8 }),
    ...QUERY_OPTS,
  });

  return (
    <>
      <Helmet>
        <title>{t('page.homeTitle')}</title>
        <meta name="description" content={t('page.homeDesc')} />
        <meta property="og:title" content={t('page.homeTitle')} />
        <meta property="og:description" content={t('page.homeDesc')} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Box mt={{ base: '-72px', md: '-88px' }}>
        <HomeHero products={featured.data ?? []} isLoading={featured.isLoading} />
      </Box>

      <Container maxW="1280px" px={{ base: 6, md: 10 }} py={{ base: '48px', md: '80px' }}>
        <SectionHeading title={t('sections.categories')} />
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 4, md: 6 }} mt={{ base: 10, md: 14 }}>
          {(categories.data ?? []).map((c) => (
            <Box
              key={c.id}
              as={RouterLink}
              to={`/menu/${c.slug}`}
              bg="warm.cream"
              border="1px solid"
              borderColor="border.gold"
              borderRadius="md"
              py={{ base: 10, md: 14 }}
              px={6}
              textAlign="center"
              transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              _hover={{
                transform: 'translateY(-4px)',
                borderColor: 'accent.goldDeep',
                borderWidth: '1.5px',
                boxShadow: 'soft',
              }}
              role="group"
            >
              <Text
                fontFamily="heading"
                fontSize={{ base: '20px', md: '24px' }}
                fontWeight={500}
                color="text.primary"
                _groupHover={{ color: 'accent.goldDeep' }}
                transition="color 400ms"
              >
                {localized(c.name_en, c.name_ar, lang)}
              </Text>
            </Box>
          ))}
          {categories.isLoading &&
            [0, 1, 2, 3].map((i) => (
              <Box
                key={`cat-skel-${i}`}
                bg="warm.cream"
                borderRadius="md"
                h={{ base: '120px', md: '160px' }}
                className="dy-shimmer"
              />
            ))}
        </SimpleGrid>
      </Container>

      <Container maxW="1280px" px={{ base: 6, md: 10 }} py={{ base: '48px', md: '80px' }}>
        <SectionHeading title={t('sections.new')} />
        <Box mt={{ base: 10, md: 14 }}>
          <ProductsGrid
            products={newArrivals.data?.results ?? []}
            isLoading={newArrivals.isLoading}
            showViewToggle
          />
        </Box>
      </Container>

      <Box bg="warm.cream" py={{ base: '48px', md: '80px' }}>
        <Container maxW="1280px" px={{ base: 6, md: 10 }}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 10, md: 16 }} alignItems="center">
            <GridItem>
              <Stack spacing={6}>
                <Box h="1px" w="40px" bg="accent.gold" opacity={0.6} />
                <Heading
                  as="h2"
                  fontSize={{ base: '32px', md: '44px' }}
                  fontWeight={500}
                  lineHeight={1.15}
                >
                  {t('sections.story')}
                </Heading>
                <Text
                  fontSize={{ base: '15px', md: '17px' }}
                  lineHeight={1.85}
                  color="text.muted"
                >
                  {t('about.short')}
                </Text>
              </Stack>
            </GridItem>
            <GridItem>
              <Box
                position="relative"
                p={3}
                border="1px solid"
                borderColor="border.gold"
                borderRadius="lg"
                bg="bg.surface"
              >
                <Box
                  as="img"
                  src={STORY_IMAGE}
                  alt={t('sections.story')}
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: { base: '300px', md: '480px' },
                    objectFit: 'cover',
                    borderRadius: '12px',
                    display: 'block',
                  }}
                />
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
