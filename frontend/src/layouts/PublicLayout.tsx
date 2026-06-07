import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useDirection } from '../hooks/useDirection';
import { useVisitTracking } from '../hooks/useVisitTracking';

export function PublicLayout() {
  useDirection();
  useVisitTracking();
  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="bg.canvas">
      <Navbar />
      <Box as="main" flex={1}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}

export default PublicLayout;
