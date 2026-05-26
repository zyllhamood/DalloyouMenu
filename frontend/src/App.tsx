import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

import './lib/i18n';
import theme from './theme';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';
import AppRoutes from './routes';

function AppShell() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const language = useUiStore((s) => s.language);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

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
