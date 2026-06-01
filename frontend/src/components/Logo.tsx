import { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
}

const ICON_HEIGHT: Record<NonNullable<LogoProps['size']>, { base: string; md: string }> = {
  sm: { base: '32px', md: '36px' },
  md: { base: '36px', md: '40px' },
  lg: { base: '40px', md: '48px' },
};

const WORD_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: '16px',
  md: '18px',
  lg: '25px',
};

export function Logo({ size = 'md', to = '/' }: LogoProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const [iconFailed, setIconFailed] = useState(false);

  const iconH = ICON_HEIGHT[size];
  const wordSize = WORD_SIZE[size];

  return (
    <Box
      as={RouterLink}
      to={to}
      display="inline-flex"
      alignItems="center"
      gap="12px"
      role="group"
      sx={{ textDecoration: 'none !important' }}
    >
      {/* ── Monogram icon ── */}
      {!iconFailed ? (
        <Box
          as="img"
          src="/icon.png"
          alt=""
          aria-hidden
          onError={() => setIconFailed(true)}
          h={iconH}
          w="auto"
          sx={{
            display: 'block',
            objectFit: 'contain',
            flexShrink: 0,
            imageRendering: 'auto',
          }}
        />
      ) : (
        /* Fallback: letter D in a gold circle if icon.svg fails to load */
        <Box
          w={iconH.md}
          h={iconH.md}
          border="1px solid"
          borderColor="accent.gold"
          borderRadius="full"
          display="grid"
          placeItems="center"
          transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          flexShrink={0}
          _groupHover={{ bg: 'accent.gold' }}
        >
          <Text
            fontFamily="'Cormorant Garamond', serif"
            fontSize={size === 'lg' ? '22px' : size === 'sm' ? '16px' : '18px'}
            fontWeight={600}
            color="accent.goldDeep"
            lineHeight={1}
            transition="color 400ms"
            _groupHover={{ color: 'warm.black' }}
          >
            D
          </Text>
        </Box>
      )}

      {/* ── Wordmark ── */}
      <Text
        fontFamily={lang === 'ar' ? `'El Messiri', serif` : `'Cormorant Garamond', serif`}
        fontSize={wordSize}
        fontWeight={500}
        letterSpacing={lang === 'ar' ? '0' : '0.32em'}
        textTransform={lang === 'ar' ? 'none' : 'uppercase'}
        color="text.primary"
        lineHeight={1}
        transition="color 400ms"
        _groupHover={{ color: 'accent.goldDeep' }}
      >
        {lang === 'ar' ? 'داليو' : 'Dalloyou'}
      </Text>
    </Box>
  );
}

export default Logo;
