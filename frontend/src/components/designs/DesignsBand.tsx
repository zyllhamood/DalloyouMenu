import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Reveal from '../ui/Reveal';
import { designImage, useDesigns } from '../../lib/designs';

/**
 * The menu's last word: for anyone who didn't find their cake on the list, a
 * glimpse of three custom designs and the way to the rest. Hidden when there
 * are no designs.
 */
export function DesignsBand() {
  const { t } = useTranslation();
  const { data } = useDesigns();
  const designs = data?.designs ?? [];
  if (!designs.length) return null;

  return (
    <Reveal>
      <Flex
        as={RouterLink}
        to="/designs"
        role="group"
        mt={{ base: 16, md: 24 }}
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        gap={{ base: 4, md: 10 }}
        px={{ base: 6, md: 10 }}
        py={{ base: 7, md: 8 }}
        borderRadius={{ base: '28px', md: '36px' }}
        // The designs are photographed on this exact ivory, so they stand free.
        bg="ivory.100"
        border="1px solid"
        borderColor="rgba(143, 91, 30, 0.22)"
        transition="border-color 400ms, box-shadow 500ms var(--dy-ease)"
        _hover={{ borderColor: 'rgba(143, 91, 30, 0.45)', boxShadow: '0 30px 60px -45px rgba(110, 69, 21, 0.55)' }}
      >
        <Box textAlign={{ base: 'center', md: 'start' }}>
          <Text fontFamily="display" fontWeight={700} fontSize={{ base: '26px', md: '32px' }} lineHeight={1.3}>
            {t('designs.menuBandTitle')}
          </Text>
          <Text mt={1} color="text.muted" fontSize={{ base: '15px', md: '16px' }}>
            {t('designs.menuBandText')}
          </Text>
        </Box>
        <HStack spacing={{ base: 0, md: 2 }} flexShrink={0} aria-hidden>
          {designs.slice(0, 3).map((design) => (
            <Box
              key={design.id}
              as="img"
              src={designImage(design, 320)}
              alt=""
              loading="lazy"
              w={{ base: '92px', md: '120px' }}
              h={{ base: '92px', md: '120px' }}
              objectFit="contain"
            />
          ))}
        </HStack>
        <Button as="span" variant="noir" h="50px" px={6} flexShrink={0} rightIcon={<ArrowLeft size={17} />}>
          {data?.title || t('designs.title')}
        </Button>
      </Flex>
    </Reveal>
  );
}

export default DesignsBand;
