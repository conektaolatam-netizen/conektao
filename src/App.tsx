import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import { TipConfigProvider } from "@/context/TipConfigContext";
import { getQueryClient } from "@/lib/queryClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import InvitationAccept from "./pages/InvitationAccept";
import NotFound from "./pages/NotFound";
import SupplierDashboardPage from "./pages/SupplierDashboard";
import SupportPage from "./pages/SupportPage";
import SupplierMarketplacePage from "./pages/SupplierMarketplacePage";
import PreRegistro from "./pages/PreRegistro";
import MenuOnboardingTest from "./pages/MenuOnboardingTest";

const queryClient = getQueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TipConfigProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/invitation" element={<InvitationAccept />} />
                  <Route path="/supplier-dashboard" element={<SupplierDashboardPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/marketplace" element={<SupplierMarketplacePage />} />
                  <Route path="/pre-registro-conektao" element={<PreRegistro />} />
                  <Route path="/menu-onboarding-test" element={<MenuOnboardingTest />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </TipConfigProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
