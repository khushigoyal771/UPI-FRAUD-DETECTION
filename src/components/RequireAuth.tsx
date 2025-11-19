import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Minimal auth gate: subscribes to auth changes first, then checks existing session
export const RequireAuth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [initializing, setInitializing] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // 1) Subscribe first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setHasSession(!!session);
      if (initializing) setInitializing(false);
    });

    // 2) Then check current session
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, [initializing]);

  const content = useMemo(() => {
    if (initializing || hasSession === null) {
      return (
        <div className="w-full py-16 flex items-center justify-center text-muted-foreground">
          Checking authentication...
        </div>
      );
    }

    if (!hasSession) {
      return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
  }, [hasSession, initializing, children]);

  return content;
};

export default RequireAuth;