import { forwardRef } from 'react';
import { Box, type BoxProps } from '@chakra-ui/react';

import { SECTION_PY, SHEET_OVERLAP, SHEET_RADIUS, SURFACE, type SurfaceKey } from './tokens';

interface HomeSectionProps extends BoxProps {
  surface: SurfaceKey;
  /** Slide over the section above with rounded top corners. */
  sheet?: boolean;
  /** Use the standard vertical padding. */
  padded?: boolean;
}

/**
 * Every home page section sits on one of three surfaces and (except the hero)
 * rises over the previous one as a rounded sheet. Each section is its own
 * stacking context, so later sections always paint over earlier ones.
 */
export const HomeSection = forwardRef<HTMLElement, HomeSectionProps>(function HomeSection(
  { surface, sheet = true, padded = true, className, children, ...rest },
  ref,
) {
  const tone = SURFACE[surface];
  const dark = surface === 'noir';
  return (
    <Box
      ref={ref}
      as="section"
      data-nav-theme={dark ? 'dark' : 'light'}
      className={[dark ? 'dy-grain' : undefined, className].filter(Boolean).join(' ') || undefined}
      position="relative"
      zIndex={0}
      bg={tone.bg}
      color={tone.color}
      mt={sheet ? SHEET_OVERLAP : undefined}
      borderTopRadius={sheet ? SHEET_RADIUS : undefined}
      py={padded ? SECTION_PY : undefined}
      // A sheet's shadow falls on the surface beneath it.
      boxShadow={sheet ? (dark ? '0 -24px 60px -30px rgba(14, 11, 8, 0.45)' : '0 -24px 60px -30px rgba(0, 0, 0, 0.6)') : undefined}
      {...rest}
    >
      {children}
    </Box>
  );
});

export default HomeSection;
