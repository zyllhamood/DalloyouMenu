import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

import i18n from './lib/i18n';
import theme from './theme';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import AppRoutes from './routes';

function AppShell() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const { pathname } = useLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    void i18n.changeLanguage('ar');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return <AppRoutes />;
}

function App() {
  return (
    <HelmetProvider>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </QueryClientProvider>
      </ChakraProvider>
    </HelmetProvider>
  );
}

export default App;
