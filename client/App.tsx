import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context Providers
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Demo utilities (available in console)
import "./utils/initDemoUsers";

// Components
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DeviceManagement from "./pages/DeviceManagement";
import DeviceDetail from "./pages/DeviceDetail";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Api from "./pages/Api";
// import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              {/* Public API docs */}
              <Route path="/apis" element={<Api />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin only routes */}
              <Route
                path="/devices"
                element={
                  <ProtectedRoute requireAdmin>
                    <DeviceManagement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/devices/:id"
                element={
                  <ProtectedRoute>
                    <DeviceDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Redirect legacy Users route to Devices */}
              <Route
                path="/users"
                element={<Navigate to="/devices" replace />}
              />

              {/* Redirect /admin to /dashboard for backward compatibility */}
              <Route
                path="/admin"
                element={<Navigate to="/dashboard" replace />}
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");
// Reuse existing root in HMR to avoid duplicate createRoot warnings
const existingRoot = (window as any).__app_root__;
const root = existingRoot || createRoot(container);
if (!existingRoot) (window as any).__app_root__ = root;
root.render(<App />);
