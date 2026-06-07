import { Box, Skeleton, Text } from '@chakra-ui/react';

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  sub?: string;
  isLoading?: boolean;
  accent?: string;
  icon?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  sub,
  isLoading = false,
  accent = 'accent.gold',
  icon,
}: StatCardProps) {
  return (
    <Box
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={6}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        insetInlineStart: 0,
        w: '3px',
        h: '100%',
        bg: accent,
        borderRadius: '3px 0 0 3px',
      }}
    >
      {/* Keep the decorative icon visually on the left in admin stat cards. */}
      {icon && (
        <Box
          position="absolute"
          top={4}
          left={4}
          color={accent}
          opacity={0.35}
        >
          {icon}
        </Box>
      )}

      <Text fontSize="11px" letterSpacing="0.24em" textTransform="uppercase" color="text.muted" mb={3}>
        {label}
      </Text>

      {isLoading ? (
        <Skeleton h="36px" w="60%" startColor="warm.cream" endColor="border.subtle" />
      ) : (
        <>
          <Text fontFamily="heading" fontSize="36px" fontWeight={500} lineHeight={1} color="text.primary">
            {value ?? '—'}
          </Text>
          {sub && (
            <Text fontSize="11px" color="text.muted" mt={1.5} letterSpacing="0.04em">
              {sub}
            </Text>
          )}
        </>
      )}
    </Box>
  );
}

export default StatCard;
