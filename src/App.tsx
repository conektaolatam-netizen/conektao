import React, { Suspense, lazy } from "react";
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

// Critical path - load immediately
import Welcome from "./pages/Welcome";
import PreRegistro from "./pages/PreRegistro";

// Lazy load non-critical routes for better Speed Index
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const InvitationAccept = lazy(() => import("./pages/InvitationAccept"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SupplierDashboardPage = lazy(() => import("./pages/SupplierDashboard"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const SupplierMarketplacePage = lazy(() => import("./pages/SupplierMarketplacePage"));
const MenuOnboardingTest = lazy(() => import("./pages/MenuOnboardingTest"));

const queryClient = getQueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Cargando...</div>
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </TipConfigProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
