import { lazy, Suspense, type ReactNode } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { Routes, Route, useLocation } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProductQuickView from './components/product/ProductQuickView';
import type { ModalState } from './lib/routing';

import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import ProductPage from './pages/ProductPage';
import NotFoundPage from './pages/NotFoundPage';

// The admin is its own bundle — storefront visitors never download it.
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminVisitsPage = lazy(() => import('./pages/admin/AdminVisitsPage'));
const AdminIpadPage = lazy(() => import('./pages/admin/AdminIpadPage'));

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <Box minH="60vh" display="grid" placeItems="center">
          <Spinner color="brand.500" thickness="2px" size="lg" />
        </Box>
      }
    >
      {children}
    </Suspense>
  );
}

export function AppRoutes() {
  const location = useLocation();
  // A product opened from inside the site keeps the page underneath rendered
  // and shows as a sheet on top (see lib/routing.ts).
  const background = (location.state as ModalState | null)?.backgroundLocation;

  return (
    <>
      <Routes location={background ?? location}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu/:categorySlug" element={<MenuPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin/login" element={<Lazy><AdminLoginPage /></Lazy>} />

        <Route
          element={
            <ProtectedRoute>
              <Lazy>
                <AdminLayout />
              </Lazy>
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Lazy><AdminDashboardPage /></Lazy>} />
          <Route path="/admin/products" element={<Lazy><AdminProductsPage /></Lazy>} />
          <Route path="/admin/products/new" element={<Lazy><AdminProductFormPage /></Lazy>} />
          <Route path="/admin/products/:id" element={<Lazy><AdminProductFormPage /></Lazy>} />
          <Route path="/admin/categories" element={<Lazy><AdminCategoriesPage /></Lazy>} />
          <Route path="/admin/visits" element={<Lazy><AdminVisitsPage /></Lazy>} />
          <Route path="/admin/ipad" element={<Lazy><AdminIpadPage /></Lazy>} />
        </Route>
      </Routes>

      {background && (
        <Routes>
          <Route path="/product/:id" element={<ProductQuickView />} />
        </Routes>
      )}
    </>
  );
}

export default AppRoutes;
