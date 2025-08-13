import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import ResourceDetail from "@/pages/ResourceDetail";
import SignUp from "@/pages/SignUp";
import SignIn from "@/pages/SignIn";
import VerifyOtp from "@/pages/VerifyOtp";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="mindley-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resource/:id"
              element={
                <ProtectedRoute>
                  <ResourceDetail />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
