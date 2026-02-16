import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Index from "./pages/Index";
import MLModels from "./pages/MLModels";
import InboundRequests from "./pages/InboundRequests";
import MapView from "./pages/MapView";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* Simple auth guard — checks localStorage */
function RequireAuth({ children }: { children: ReactNode }) {
  const raw = localStorage.getItem("fraudx_auth");
  if (!raw) return <Navigate to="/login" replace />;
  try {
    const auth = JSON.parse(raw);
    if (!auth.loggedIn) return <Navigate to="/login" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
          <Route path="/ml-models" element={<RequireAuth><MLModels /></RequireAuth>} />
          <Route path="/inbound" element={<RequireAuth><InboundRequests /></RequireAuth>} />
          <Route path="/map" element={<RequireAuth><MapView /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
