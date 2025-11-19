import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/logo-clean.png";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Login | UPI Fraud Detection";

    // Set listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // If already authenticated, go home
        navigate("/", { replace: true });
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Logged in successfully");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      setMessage("Verification email sent! Please check your inbox.");
      toast.success("Signup successful. Check your email to confirm.");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary-variant flex items-center justify-center shadow-lg">
            <img 
              src={logo}
              alt="UPI Fraud Detection Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to emoji if logo fails to load
                e.currentTarget.style.display = 'none';
                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextSibling) nextSibling.style.display = 'block';
              }}
            />
            <span className="text-2xl" style={{ display: 'none' }}>🛡️</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-variant bg-clip-text text-transparent mb-2">
            UPI Fraud Detection
          </h1>
          <p className="text-muted-foreground">Advanced AI-powered fraud protection</p>
        </div>

        <Card className="surface-elevated border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Secure your transactions with AI-powered protection</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-muted/50">
                <TabsTrigger value="login" className="h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-background border-border focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter your password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-background border-border focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleLogin} 
                  disabled={loading} 
                  className="w-full h-12 btn-hero font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email2" className="text-sm font-medium">Email Address</Label>
                    <Input 
                      id="email2" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-background border-border focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2" className="text-sm font-medium">Password</Label>
                    <Input 
                      id="password2" 
                      type="password" 
                      placeholder="Create a strong password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-background border-border focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSignup} 
                  disabled={loading} 
                  className="w-full h-12 btn-hero font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {message && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-success">
                      <span className="text-lg">✉️</span>
                      <p className="text-sm font-medium">{message}</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
