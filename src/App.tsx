
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import AffiliateApplication from "./pages/AffiliateApplication";
import SetupComplete from "./pages/SetupComplete";
import Demo from "./pages/Demo";
import DemoSelector from "./components/demo/DemoSelector";
import ProtectedRoute from "./components/ProtectedRoute";
import VendorManagement from "./components/vendor/VendorManagement";
import ResourcesManagement from "./components/resources/ResourcesManagement";
import SubmissionsManager from "./components/submissions/SubmissionsManager";
import PartnerSettings from "./components/settings/PartnerSettings";
import ResellerManagement from "./components/resellers/ResellerManagement";
import RootRedirect from "./components/RootRedirect";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SubscriptionProvider>
          <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/setup-complete" element={<SetupComplete />} />
              <Route path="/affiliate-application" element={<AffiliateApplication />} />
              <Route path="/demo" element={<DemoSelector />} />
              <Route path="/demo-live" element={<Demo />} />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              } />
              <Route path="/vendors" element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Partner Admin']}>
                  <VendorManagement />
                </ProtectedRoute>
              } />
              <Route path="/resources" element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Partner Admin']}>
                  <ResourcesManagement />
                </ProtectedRoute>
              } />
              <Route path="/submissions" element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Partner Admin']}>
                  <SubmissionsManager />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['Super Admin', 'Partner Admin']}>
                  <PartnerSettings />
                </ProtectedRoute>
              } />
              <Route path="/resellers" element={
                <ProtectedRoute allowedRoles={['Super Admin']}>
                  <ResellerManagement />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </AuthProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
