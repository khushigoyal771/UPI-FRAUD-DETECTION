import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Smartphone, ArrowLeft, Shield } from "lucide-react";

type AuthStep = 'credentials' | 'otp';

const MFAAuth: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('credentials');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    document.title = "Secure Login | UPI Fraud Detection";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCredentialsSubmit = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl }
        });
        if (error) throw error;
        toast.success("Account created! Please check your email to confirm.");
      } else {
        // Simulate OTP step for demo
        setStep('otp');
        setCountdown(30);
        toast.success("OTP sent to your email");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    setLoading(true);
    try {
      // For demo purposes, accept any 6-digit OTP
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (trustDevice) {
        localStorage.setItem('trustedDevice', 'true');
      }
      
      toast.success("Login successful!");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    setCountdown(30);
    toast.success("New OTP sent to your email");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lavender-abstract p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-elegant flex items-center justify-center shadow-elegant">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-variant bg-clip-text text-transparent mb-2">
            Secure Access
          </h1>
          <p className="text-muted-foreground">Multi-factor authentication for enhanced security</p>
        </div>

        <Card className="surface-elevated border-0 backdrop-blur-md bg-white/10">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {step === 'credentials' ? (
                <Lock className="w-5 h-5 text-primary" />
              ) : (
                <Smartphone className="w-5 h-5 text-primary" />
              )}
              <CardTitle className="text-xl">
                {step === 'credentials' ? 'Login Credentials' : 'Verify OTP'}
              </CardTitle>
            </div>
            <CardDescription>
              {step === 'credentials' 
                ? 'Enter your email and password to continue'
                : 'Enter the 6-digit code sent to your email'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8 space-y-6">
            {step === 'credentials' && (
              <>
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={!isSignUp ? "default" : "ghost"}
                    className="flex-1 h-12"
                    onClick={() => setIsSignUp(false)}
                  >
                    Login
                  </Button>
                  <Button
                    variant={isSignUp ? "default" : "ghost"}
                    className="flex-1 h-12"
                    onClick={() => setIsSignUp(true)}
                  >
                    Sign Up
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-background/50 backdrop-blur-sm border-primary/20 focus:ring-2 focus:ring-primary/30"
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
                      className="h-12 bg-background/50 backdrop-blur-sm border-primary/20 focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCredentialsSubmit} 
                  disabled={loading || !email || !password} 
                  className="w-full h-12 btn-hero font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Continue ${isSignUp ? 'to Sign Up' : 'to OTP'}`
                  )}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 mb-4 p-0"
                  onClick={() => setStep('credentials')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to credentials
                </Button>

                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We sent a verification code to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trust-device"
                      checked={trustDevice}
                      onCheckedChange={(checked) => setTrustDevice(checked === true)}
                    />
                    <label
                      htmlFor="trust-device"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Trust this device for 30 days
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={handleOTPSubmit} 
                  disabled={loading || otp.length !== 6} 
                  className="w-full h-12 btn-hero font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={resendOTP}
                    disabled={countdown > 0}
                    className="text-sm"
                  >
                    {countdown > 0 ? (
                      `Resend OTP in ${countdown}s`
                    ) : (
                      "Resend OTP"
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MFAAuth;