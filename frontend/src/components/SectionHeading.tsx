import { Box, Heading, VStack } from '@chakra-ui/react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  align?: 'center' | 'start';
}

export function SectionHeading({ eyebrow, title, align = 'center' }: SectionHeadingProps) {
  return (
    <VStack spacing={3} align={align}>
      {eyebrow && (
        <Box
          fontSize="10px"
          letterSpacing="0.32em"
          textTransform="uppercase"
          color="accent.goldDeep"
        >
          {eyebrow}
        </Box>
      )}
      <Heading
        as="h2"
        fontFamily="heading"
        fontWeight={500}
        fontSize={{ base: '32px', md: '44px' }}
        textAlign={align}
        lineHeight={1.1}
      >
        {title}
      </Heading>
      <Box h="1px" w="56px" bg="accent.gold" opacity={0.6} />
    </VStack>
  );
}

export default SectionHeading;
