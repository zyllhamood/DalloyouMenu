/**
 * The arch — Dalloyou's display niche. A true semicircular top needs the
 * vertical radius expressed relative to the box height (width / 2 ÷ height),
 * so it's computed from the aspect ratio rather than using `999px` (which
 * would also collapse the bottom corners, because CSS scales every radius
 * down together).
 */
export function archRadius(ratio: number, foot: number): string {
  const vertical = `${(50 * ratio).toFixed(3)}%`;
  return `50% 50% ${foot}px ${foot}px / ${vertical} ${vertical} ${foot}px ${foot}px`;
}
