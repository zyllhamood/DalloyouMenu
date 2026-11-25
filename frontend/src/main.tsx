import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/global.css';
import App from './App';
import { seedFromBoot } from './lib/boot';
import { queryClient } from './lib/queryClient';

// A prerendered page hands over the data it was built with.
seedFromBoot(queryClient, window.__DALLOYOU__);
// …and the head tags it was built with: React renders the page's own from here on.
document.querySelectorAll('head [data-ssr]').forEach((el) => el.remove());
// Pages that set no title of their own (the admin) keep the house name.
if (!document.title) document.title = 'داليو — حلويات فاخرة';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
