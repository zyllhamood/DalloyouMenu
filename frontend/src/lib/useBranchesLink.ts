import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { navHeight, scrollToElement } from './motion';

export const BRANCHES_ID = 'branches';
export const BRANCHES_TO = `/#${BRANCHES_ID}`;

/**
 * Click handler for "our branches" links: glides to the section when it is
 * already on the page, otherwise navigates home and lets the layout scroll to
 * the hash once the page has rendered.
 */
export function useBranchesLink() {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();

  return (event: MouseEvent) => {
    event.preventDefault();
    const target = document.getElementById(BRANCHES_ID);
    if (pathname === '/' && target) {
      if (hash !== `#${BRANCHES_ID}`) navigate(BRANCHES_TO, { replace: true, preventScrollReset: true });
      scrollToElement(target, navHeight() + 8);
      return;
    }
    navigate(BRANCHES_TO);
  };
}
