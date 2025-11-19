import React, { useEffect, useState } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ChatAssistant from "@/components/ChatAssistant";
import { useTheme } from "@/contexts/ThemeContext";
import { User, LogOut, Sun, Moon, Bell } from "lucide-react";
import logo from "@/assets/logo-clean.png";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/upload", label: "Upload" },
  { to: "/train", label: "Train" },
  { to: "/predict", label: "Predict" },
  { to: "/stream", label: "Stream" },
  { to: "/analytics", label: "Analytics" },
  { to: "/alerts", label: "Alerts" },
  { to: "/qr-scan", label: "QR Scan" },
  { to: "/contact", label: "Contact" },
];

export default function Layout() {
  const location = useLocation();
  const [authed, setAuthed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const titleMap: Record<string, string> = {
      "/": "UPI Fraud Detection | Dashboard",
      "/upload": "Upload Dataset | UPI Fraud Detection",
      "/train": "Train Model | UPI Fraud Detection", 
      "/predict": "Fraud Prediction Tool | UPI Fraud Detection",
      "/stream": "Real-Time Stream | UPI Fraud Detection",
      "/analytics": "Analytics Dashboard | UPI Fraud Detection",
      "/alerts": "Alerts & Notifications | UPI Fraud Detection",
      "/qr-scan": "QR Security Scanner | UPI Fraud Detection",
      "/contact": "Contact Us | UPI Fraud Detection",
    };
    document.title = titleMap[location.pathname] || "UPI Fraud Detection";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Interactive UPI fraud detection dashboard with dataset upload, in-browser model training, live predictions, and analytics.");
  }, [location.pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-lavender-elegant">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-4 focus:outline-none">
            <img src={logo} alt="UPI Fraud Detection Logo" className="w-12 h-12" />
            <span className="font-brand text-2xl bg-gradient-text bg-clip-text text-transparent">
              UPI Fraud Detection
            </span>
          </NavLink>
          <div className="flex items-center gap-1 flex-wrap">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                {item.label}
              </NavLink>
            ))}
            <a href="#get-started" className="sr-only">Skip to content</a>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg hover:bg-accent/50"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            
            {authed ? (
              <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); }} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <NavLink to="/auth" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Login
                </NavLink>
              </Button>
            )}
          </div>
        </nav>
      </header>
      <main id="get-started" className="container mx-auto px-6 py-8 flex-1 w-full">
        <div className="content-overlay rounded-xl p-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} UPI Fraud Detection Demo
      </footer>
      
      <ChatAssistant />
    </div>
  );
}
