import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import EquipmentPage from "@/pages/equipos/EquipmentPage";
import EquipmentDetailPage from "@/pages/equipos/EquipmentDetailPage";
import PublicEquipmentPage from "@/pages/equipos/PublicEquipmentPage";
import WorkOrdersPage from "@/pages/ordenes/WorkOrdersPage";
import MaintenancePage from "@/pages/MantenimientoPage";
import SparePartsPage from "@/pages/repuestos/SparePartsPage";
import UsersPage from "@/pages/usuarios/UsersPage";
import DocumentsPage from "@/pages/DocumentsPage";
import FallasPage from "@/pages/FallasPage";
import QRScannerPage from "@/pages/QRScannerPage";
import AuditoriaPage from "@/pages/AuditoriaPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/equipo/:uuid" element={<PublicEquipmentPage />} />
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
                  <EquipmentDetailPage />
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
                  <UsersPage />
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
                  <QRScannerPage />
                </AppLayout>
              }
            />
            <Route
              path="/auditoria"
              element={
                <AppLayout>
                  <AuditoriaPage />
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
