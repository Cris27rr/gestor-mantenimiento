import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import PageLoader from "@/components/layout/PageLoader";

import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import EquipmentPage from "@/pages/equipos/EquipmentPage";
import WorkOrdersPage from "@/pages/ordenes/WorkOrdersPage";
import MaintenancePage from "@/pages/MantenimientoPage";
import SparePartsPage from "@/pages/repuestos/SparePartsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import FallasPage from "@/pages/FallasPage";
import NotFound from "@/pages/NotFound";

const EquipmentDetailPage = lazy(() => import("@/pages/equipos/EquipmentDetailPage"));
const PublicEquipmentPage = lazy(() => import("@/pages/equipos/PublicEquipmentPage"));
const UsersPage = lazy(() => import("@/pages/usuarios/UsersPage"));
const QRScannerPage = lazy(() => import("@/pages/QRScannerPage"));
const AuditoriaPage = lazy(() => import("@/pages/AuditoriaPage"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/equipo/:uuid"
              element={
                <LazyPage>
                  <PublicEquipmentPage />
                </LazyPage>
              }
            />
            <Route
              path="/"
              element={
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/equipos"
              element={
                <AppLayout>
                  <EquipmentPage />
                </AppLayout>
              }
            />
            <Route
              path="/equipos/:id"
              element={
                <AppLayout>
                  <LazyPage>
                    <EquipmentDetailPage />
                  </LazyPage>
                </AppLayout>
              }
            />
            <Route
              path="/ordenes"
              element={
                <AppLayout>
                  <WorkOrdersPage />
                </AppLayout>
              }
            />
            <Route
              path="/mantenimientos"
              element={
                <AppLayout>
                  <MaintenancePage />
                </AppLayout>
              }
            />
            <Route
              path="/repuestos"
              element={
                <AppLayout>
                  <SparePartsPage />
                </AppLayout>
              }
            />
            <Route
              path="/usuarios"
              element={
                <AppLayout>
                  <LazyPage>
                    <UsersPage />
                  </LazyPage>
                </AppLayout>
              }
            />
            <Route
              path="/documentos"
              element={
                <AppLayout>
                  <DocumentsPage />
                </AppLayout>
              }
            />
            <Route
              path="/fallas"
              element={
                <AppLayout>
                  <FallasPage />
                </AppLayout>
              }
            />
            <Route
              path="/escanear"
              element={
                <AppLayout>
                  <LazyPage>
                    <QRScannerPage />
                  </LazyPage>
                </AppLayout>
              }
            />
            <Route
              path="/auditoria"
              element={
                <AppLayout>
                  <LazyPage>
                    <AuditoriaPage />
                  </LazyPage>
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
