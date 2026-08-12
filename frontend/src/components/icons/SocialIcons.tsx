/**
 * Social glyphs — lucide-react has no Instagram / TikTok / Snapchat marks,
 * so these are inline SVGs kept in one place and shared by the hero, navbar
 * and footer.
 *
 * House rules for every glyph here:
 *   · 24x24 viewBox, sized by the `size` prop (px)
 *   · colour comes from `currentColor` so the parent controls it
 *   · Instagram is stroked (1.8) to sit beside lucide's stroke icons;
 *     TikTok and Snapchat are solid marks — their shapes don't read as
 *     outlines at small sizes.
 */

import { Box } from '@chakra-ui/react';

interface GlyphProps {
  /** Rendered width/height in px. Default 20. */
  size?: number;
}

export function InstagramGlyph({ size = 20 }: GlyphProps) {
  return (
    <Box
      as="svg"
      width={`${size}px`}
      height={`${size}px`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Box>
  );
}

export function TikTokGlyph({ size = 20 }: GlyphProps) {
  return (
    <Box
      as="svg"
      width={`${size}px`}
      height={`${size}px`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.08z" />
    </Box>
  );
}

export function SnapchatGlyph({ size = 20 }: GlyphProps) {
  return (
    <Box
      as="svg"
      width={`${size}px`}
      height={`${size}px`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.2c2.6 0 4.6 2 4.7 4.6.03.72 0 1.42-.04 2.05.28.12.62.16.98.05.28-.08.6.02.75.28.16.28.08.63-.18.82-.3.22-.78.4-1.2.55-.3.11-.6.21-.66.4-.08.24.1.6.3.95.62 1.1 1.6 2.05 2.83 2.4.28.08.46.35.42.63-.06.42-.55.72-1.5.92-.3.06-.5.1-.6.3-.06.13-.06.3-.1.5-.05.24-.14.45-.45.45-.3 0-.63-.1-1.1-.13-.3-.02-.6-.01-.9.04-.6.1-1.1.5-1.66.9-.66.48-1.4.9-2.44.9s-1.78-.42-2.44-.9c-.56-.4-1.06-.8-1.66-.9a3.6 3.6 0 0 0-.9-.04c-.47.03-.8.13-1.1.13-.31 0-.4-.21-.45-.45-.04-.2-.04-.37-.1-.5-.1-.2-.3-.24-.6-.3-.95-.2-1.44-.5-1.5-.92a.56.56 0 0 1 .42-.63c1.23-.35 2.21-1.3 2.83-2.4.2-.35.38-.71.3-.95-.06-.19-.36-.29-.66-.4-.42-.15-.9-.33-1.2-.55a.6.6 0 0 1-.18-.82c.15-.26.47-.36.75-.28.36.11.7.07.98-.05A25 25 0 0 1 7.3 6.8C7.4 4.2 9.4 2.2 12 2.2z" />
    </Box>
  );
}
