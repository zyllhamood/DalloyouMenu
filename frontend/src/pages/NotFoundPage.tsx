import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{`404 — ${t('brand.name')}`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <Container
        maxW="640px"
        px={{ base: 6, md: 10 }}
        py={{ base: '72px', md: '140px' }}
      >
        <Stack spacing={6} align="center" textAlign="center">
          <Text
            fontFamily="heading"
            fontSize={{ base: '72px', md: '104px' }}
            fontWeight={500}
            lineHeight={1}
            color="accent.gold"
          >
            404
          </Text>

          <Box h="1px" w="56px" bg="accent.gold" opacity={0.6} />

          <Heading
            as="h1"
            fontFamily="heading"
            fontWeight={500}
            fontSize={{ base: '28px', md: '36px' }}
            lineHeight={1.15}
          >
            {t('notFound.title')}
          </Heading>

          <Text fontSize={{ base: '15px', md: '16px' }} color="text.muted" lineHeight={1.7} maxW="420px">
            {t('notFound.subtitle')}
          </Text>

          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} pt={2} w={{ base: '100%', sm: 'auto' }}>
            <Button as={RouterLink} to="/" variant="blackGold" size="lg">
              {t('notFound.backHome')}
            </Button>
            <Button as={RouterLink} to="/menu" variant="goldOutline" size="lg">
              {t('notFound.browseMenu')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
