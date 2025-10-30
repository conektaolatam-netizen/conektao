import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import InvitationAccept from "./pages/InvitationAccept";
import NotFound from "./pages/NotFound";
import SupplierDashboardPage from "./pages/SupplierDashboard";
import SupportPage from "./pages/SupportPage";
import SupplierMarketplacePage from "./pages/SupplierMarketplacePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
