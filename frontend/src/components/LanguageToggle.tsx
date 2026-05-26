import { HStack, Box, Button } from '@chakra-ui/react';

import { useUiStore } from '../stores/uiStore';

export function LanguageToggle() {
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  const item = (code: 'en' | 'ar', label: string) => {
    const active = language === code;
    return (
      <Button
        variant="ghostGold"
        size="sm"
        onClick={() => setLanguage(code)}
        px={2}
        minW="auto"
        h="auto"
        py={1}
        fontFamily={code === 'ar' ? `'El Messiri', serif` : `'Inter', sans-serif`}
        fontSize="13px"
        letterSpacing="0.12em"
        color={active ? 'accent.goldDeep' : 'text.muted'}
        fontWeight={active ? 600 : 400}
        _hover={{ color: 'accent.goldDeep', bg: 'transparent' }}
        aria-pressed={active}
      >
        {label}
      </Button>
    );
  };

  return (
    <HStack spacing={1} align="center">
      {item('en', 'EN')}
      <Box w="1px" h="14px" bg="border.gold" />
      {item('ar', 'ع')}
    </HStack>
  );
}

export default LanguageToggle;
