import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

import Monogram from '../components/brand/Monogram';
import ArchStage, { ArchOutline } from '../components/brand/Arch';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{`404 — ${t('brand.name')}`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Container maxW="640px" pt={{ base: 'calc(var(--dy-nav-h) + 56px)', md: 'calc(var(--dy-nav-h) + 88px)' }} pb={{ base: 28, md: 36 }} data-nav-theme="light">
        <Stack spacing={7} align="center" textAlign="center">
          <Box position="relative" w={{ base: '180px', md: '220px' }}>
            <Box position="absolute" inset="-12px">
              <ArchOutline color="rgba(194, 134, 62, 0.45)" />
            </Box>
            <ArchStage ratio={0.8} foot={20}>
              <Box position="absolute" inset={0} display="grid" placeItems="center">
                <Monogram large sheen w="42%" h="42%" />
              </Box>
            </ArchStage>
          </Box>

          <Text fontFamily="latin" lang="en" fontSize={{ base: '15px', md: '16px' }} letterSpacing="0.4em" color="brand.700" ps="0.4em">
            404
          </Text>

          <Heading as="h1" fontFamily="display" fontWeight={700} fontSize={{ base: '34px', md: '44px' }} lineHeight={1.3}>
            {t('notFound.title')}
          </Heading>

          <Text fontSize={{ base: '15px', md: '17px' }} color="text.muted" lineHeight={1.8} maxW="420px">
            {t('notFound.subtitle')}
          </Text>

          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} pt={2} w={{ base: '100%', sm: 'auto' }}>
            <Button as={RouterLink} to="/menu" variant="noir" size="lg">
              {t('notFound.browseMenu')}
            </Button>
            <Button as={RouterLink} to="/" variant="outlineInk" size="lg">
              {t('notFound.backHome')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
