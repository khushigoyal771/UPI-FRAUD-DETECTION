import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Smartphone, AlertTriangle, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AlertService } from "@/services/alertService";

interface AlertSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  emailAddress: string;
  phoneNumber: string;
  priority: 'high' | 'medium-high' | 'all';
}

interface FraudAlert {
  id: string;
  amount: number;
  timestamp: string;
  risk_level: string;
  transaction_type: string;
  alert_sent: boolean;
  email_sent: boolean;
  fraud_probability: number;
  location?: string;
}

const AlertsNotifications: React.FC = () => {
  const [settings, setSettings] = useState<AlertSettings>({
    emailAlerts: true,
    smsAlerts: false,
    whatsappAlerts: false,
    emailAddress: '',
    phoneNumber: '',
    priority: 'high'
  });

  const [recentAlerts, setRecentAlerts] = useState<FraudAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const [showDemoAlert, setShowDemoAlert] = useState(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('alertSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    
    // Load recent alerts
    loadRecentAlerts();
  }, []);

  const loadRecentAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const alerts = await AlertService.getRecentAlerts(10);
      setRecentAlerts(alerts);
    } catch (error) {
      console.error('Failed to load recent alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('alertSettings', JSON.stringify(settings));
    toast.success("Alert settings saved successfully!");
  };

  const testAlert = async () => {
    if (!settings.emailAddress && settings.emailAlerts) {
      toast.error("Please enter an email address to test alerts");
      return;
    }
    
    try {
      const testTransaction = {
        transactionId: `TEST_${Date.now()}`,
        amount: 25000,
        timestamp: new Date().toISOString(),
        location: "Test Location",
        transactionType: "P2P",
        fraudProbability: 0.85,
      };
      
      const result = await AlertService.sendFraudAlert(testTransaction);
      
      if (result.success) {
        setShowDemoAlert(true);
        toast.success("Test alert sent successfully!", {
          description: settings.emailAlerts ? `Check ${settings.emailAddress} for the test alert` : "Test alert processed"
        });
        setTimeout(() => setShowDemoAlert(false), 5000);
        
        // Refresh alerts to show the new test alert
        loadRecentAlerts();
      } else {
        toast.error("Failed to send test alert", {
          description: result.error || "Unknown error"
        });
      }
    } catch (error) {
      console.error("Test alert error:", error);
      toast.error("Failed to send test alert");
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'low': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Alert Popup */}
      {showDemoAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <Card className="w-80 border-red-500/50 bg-red-500/5 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                    HIGH RISK
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-1"
                  onClick={() => setShowDemoAlert(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <h4 className="font-semibold text-red-700 mb-1">
                Test Alert: Suspicious Transaction Detected
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                ₹25,000 flagged as suspicious at {new Date().toLocaleTimeString()}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Alert sent via:</span>
                {settings.emailAlerts && <Mail className="w-3 h-3" />}
                {settings.smsAlerts && <Smartphone className="w-3 h-3" />}
                {settings.whatsappAlerts && <MessageSquare className="w-3 h-3" />}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Configure real-time fraud detection alerts</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alert Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive fraud detection alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <Label className="text-base font-medium">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, emailAlerts: checked})}
                  />
                </div>
                
                {settings.emailAlerts && (
                  <div className="ml-8 space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={settings.emailAddress}
                      onChange={(e) => setSettings({...settings, emailAddress: e.target.value})}
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <div>
                      <Label className="text-base font-medium">SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, smsAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <Label className="text-base font-medium">WhatsApp Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via WhatsApp</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.whatsappAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, whatsappAlerts: checked})}
                  />
                </div>

                {(settings.smsAlerts || settings.whatsappAlerts) && (
                  <div className="ml-8 space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Alert Priority</CardTitle>
              <CardDescription>
                Choose which risk levels should trigger alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.priority}
                onValueChange={(value) => setSettings({...settings, priority: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High Risk Only</SelectItem>
                  <SelectItem value="medium-high">🟠 Medium & High Risk</SelectItem>
                  <SelectItem value="all">🟡 All Risk Levels</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={saveSettings} className="btn-hero">
              Save Settings
            </Button>
            <Button onClick={testAlert} variant="outline">
              Test Alert
            </Button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-6">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Recent Alerts
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={loadRecentAlerts}
                  disabled={loadingAlerts}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAlerts ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAlerts ? (
                <div className="p-4 text-center text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Loading recent alerts...
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No fraud alerts yet</p>
                  <p className="text-xs">Alerts will appear here when fraud is detected</p>
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getRiskColor(alert.risk_level)}>
                        {alert.risk_level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">₹{Number(alert.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{alert.transaction_type}</p>
                    {alert.location && (
                      <p className="text-xs text-muted-foreground">📍 {alert.location}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <div className={`w-2 h-2 rounded-full ${alert.alert_sent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-xs ${alert.alert_sent ? 'text-green-600' : 'text-red-600'}`}>
                        {alert.alert_sent ? 'Alert sent' : 'Alert failed'}
                      </span>
                      {alert.email_sent && (
                        <>
                          <Mail className="w-3 h-3 ml-2 text-blue-500" />
                          <span className="text-xs text-blue-600">Email</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Fraud probability: {(alert.fraud_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Stay Protected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time alerts help you catch fraudulent activities as they happen.
              </p>
              <div className="text-xs text-muted-foreground">
                Response time: &lt; 30 seconds
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlertsNotifications;