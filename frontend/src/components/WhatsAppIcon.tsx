import { Box, Link as ChakraLink, Icon } from '@chakra-ui/react';

import { WHATSAPP_ORDER_URL } from '../config/links';

export function WhatsAppGlyph(props: { size?: number }) {
  return (
    <Icon viewBox="0 0 24 24" boxSize={`${props.size ?? 18}px`} aria-hidden>
      <path
        fill="currentColor"
        d="M19.11 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91a9.86 9.86 0 0 0 1.32 4.94L2 22l5.29-1.39a9.91 9.91 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.84-6.99zM12.04 20.15h-.01a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.17.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.13.17 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.18-.48-.31z"
      />
    </Icon>
  );
}

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <ChakraLink
      href={WHATSAPP_ORDER_URL}
      isExternal
      aria-label="WhatsApp"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="36px"
      h="36px"
      borderRadius="full"
      border="1px solid"
      borderColor="border.gold"
      color="accent.goldDeep"
      transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      _hover={{
        bg: 'accent.gold',
        color: 'warm.black',
        textDecoration: 'none',
        transform: 'translateY(-2px)',
      }}
    >
      <Box as="span" display="inline-flex">
        <WhatsAppGlyph size={size} />
      </Box>
    </ChakraLink>
  );
}

export default WhatsAppIcon;
