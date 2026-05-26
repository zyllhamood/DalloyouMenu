import { Box, Container, Heading, Text } from '@chakra-ui/react';

interface PageStubProps {
  title: string;
  subtitle?: string;
}

export function PageStub({ title, subtitle }: PageStubProps) {
  return (
    <Container maxW="1280px" py={{ base: '48px', md: '120px' }} px={{ base: 6, md: 10 }}>
      <Box maxW="720px">
        <Box
          h="1px"
          w="56px"
          bg="accent.gold"
          opacity={0.6}
          mb={6}
        />
        <Heading as="h1" size="display" mb={6}>
          {title}
        </Heading>
        {subtitle && (
          <Text fontSize={{ base: '16px', md: '18px' }} color="text.muted" lineHeight={1.7}>
            {subtitle}
          </Text>
        )}
      </Box>
    </Container>
  );
}

export default PageStub;
