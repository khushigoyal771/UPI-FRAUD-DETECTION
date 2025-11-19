import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Train from "./pages/Train";
import Predict from "./pages/Predict";
import Stream from "./pages/Stream";
import Analytics from "./pages/Analytics";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import AlertsNotifications from "./components/AlertsNotifications";
import QRScan from "./pages/QRScan";
import { MLProvider } from "@/context/MLContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const App = () => (
  <TooltipProvider>
    <ThemeProvider>
      <MLProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Index />} />
            <Route path="upload" element={<Upload />} />
            <Route path="train" element={<Train />} />
            <Route path="predict" element={<Predict />} />
            <Route path="stream" element={<Stream />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="alerts" element={<AlertsNotifications />} />
            <Route path="qr-scan" element={<QRScan />} />
            <Route path="contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
        <Sonner />
      </MLProvider>
    </ThemeProvider>
  </TooltipProvider>
);

export default App;
