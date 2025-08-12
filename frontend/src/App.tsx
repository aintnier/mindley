import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import ResourceDetail from "@/pages/ResourceDetail";
import { ThemeProvider } from "@/components/theme-provider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="mindly-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
