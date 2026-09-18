import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';

import i18n from './lib/i18n';
import theme from './theme';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { useVisitTracking } from './hooks/useVisitTracking';
import AppRoutes from './routes';

function AppShell() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    void i18n.changeLanguage('ar');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    // Scroll positions are restored by the storefront layout itself.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  // Tracks the real URL — including products opened as a sheet.
  useVisitTracking();

  return <AppRoutes />;
}

function App() {
  return (
    <HelmetProvider>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <MotionConfig reducedMotion="user">
              <AppShell />
            </MotionConfig>
          </BrowserRouter>
        </QueryClientProvider>
      </ChakraProvider>
    </HelmetProvider>
  );
}

export default App;
