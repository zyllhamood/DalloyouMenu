import { Box, Button, Container } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ProductRail from '../product/ProductRail';
import SectionHeader from '../ui/SectionHeader';
import { useMenuIndex } from '../../lib/menu';

/** The newest pieces, on a shelf you can swipe along. */
export function NewArrivals() {
  const { t, i18n } = useTranslation();
  const { index } = useMenuIndex();
  const rtl = i18n.dir() === 'rtl';

  if (index.fresh.length === 0) return null;

  return (
    <Box as="section" data-nav-theme="light" pb={{ base: 20, md: 28, xl: 32 }} aria-labelledby="home-new">
      <Container maxW="1320px">
        <SectionHeader
          headingId="home-new"
          eyebrow={t('home.newEyebrow')}
          title={t('home.newTitle')}
          mb={{ base: 9, md: 12 }}
          pe={{ md: index.fresh.length > 3 ? '120px' : 0 }}
          action={
            <Button
              as={RouterLink}
              to="/menu"
              variant="outlineInk"
              h="46px"
              px={6}
              display={{ base: 'none', md: 'inline-flex' }}
              rightIcon={rtl ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}
            >
              {t('home.viewAll')}
            </Button>
          }
        />
        <ProductRail products={index.fresh} label={t('home.newTitle')} />
      </Container>
    </Box>
  );
}

export default NewArrivals;
