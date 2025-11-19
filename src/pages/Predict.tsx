import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Upload, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useML } from "@/context/MLContext";

const PredictPage: React.FC = () => {
  const { predictRow, encoders, model, loadSampleDataset, dataset } = useML();

  const [form, setForm] = useState({
    Amount: 999,
    Timestamp: new Date().toISOString().slice(0, 16),
    Location: "Delhi",
    DeviceID: "dev-001",
    TransactionType: "P2P",
    TransactionID: "",
    UserID: "",
  });
  const [result, setResult] = useState<{ prob: number; label: string; confidence: number; risk: string }>();
  const [identifierType, setIdentifierType] = useState<"DeviceID" | "TransactionID" | "UserID">("DeviceID");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    document.title = "Fraud Prediction Tool | UPI Fraud Detection";
  }, []);

  const getAvailableIdentifiers = () => {
    if (!dataset.length) return ["DeviceID", "TransactionID", "UserID"];
    const hasDeviceID = dataset.some(row => row.DeviceID);
    const hasTransactionID = dataset.some(row => row.TransactionID);
    const hasUserID = dataset.some(row => row.UserID);
    
    const available = [];
    if (hasDeviceID) available.push("DeviceID");
    if (hasTransactionID) available.push("TransactionID");
    if (hasUserID) available.push("UserID");
    
    return available.length ? available : ["DeviceID"];
  };

  const analyzePatterns = (amount: number, type: string, timestamp: string) => {
    const hour = new Date(timestamp).getHours();
    const patterns = {
      suspiciousAmount: amount > 50000 || amount < 1,
      oddTiming: hour < 6 || hour > 23,
      riskType: ["Transfer", "P2P", "Online"].includes(type),
      weekendTransaction: [0, 6].includes(new Date(timestamp).getDay())
    };
    
    const riskFactors = Object.values(patterns).filter(Boolean).length;
    return {
      riskLevel: riskFactors > 2 ? "HIGH" : riskFactors > 1 ? "MEDIUM" : "LOW",
      patterns
    };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model) return;
    
    setIsAnalyzing(true);
    try {
      const iso = form.Timestamp.includes("T") ? new Date(form.Timestamp) : new Date(form.Timestamp);
      
      // Create dynamic payload based on identifier type
      const payload: any = {
        Amount: Number(form.Amount),
        Timestamp: iso.toISOString(),
        Location: form.Location,
        TransactionType: form.TransactionType,
      };
      
      // Add the appropriate identifier
      if (identifierType === "DeviceID") payload.DeviceID = form.DeviceID;
      else if (identifierType === "TransactionID") payload.TransactionID = form.TransactionID;
      else if (identifierType === "UserID") payload.UserID = form.UserID;
      
      const res = await predictRow(payload);
      const patterns = analyzePatterns(payload.Amount, payload.TransactionType, payload.Timestamp);
      
      setResult({
        prob: res.prob,
        label: res.label,
        confidence: Math.round(res.prob * 100),
        risk: patterns.riskLevel
      });
    } catch (error) {
      console.error("Prediction error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Intelligent Fraud Detection System</h1>
            <p className="text-muted-foreground">Advanced real-time transaction analysis with adaptive field recognition</p>
          </div>
        </div>
      </header>

      {!model && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              System Not Ready
            </CardTitle>
            <CardDescription>Train the AI model or load sample data to enable intelligent fraud detection</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="hero" asChild>
              <Link to="/train">
                <Upload className="w-4 h-4 mr-2" />
                Train Model
              </Link>
            </Button>
            <Button variant="secondary" onClick={loadSampleDataset}>Load Sample Data</Button>
          </CardContent>
        </Card>
      )}

      <Card className="surface-elevated border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            🔮 Real-Time Fraud Detection Engine
          </CardTitle>
          <CardDescription>
            Advanced AI system with adaptive field recognition • Handles varying CSV structures • Dynamic identifier mapping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">CSV Adaptive</Badge>
              <span className="text-muted-foreground">Handles any column format</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Real-time</Badge>
              <span className="text-muted-foreground">Instant predictions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Behavioral</Badge>
              <span className="text-muted-foreground">Pattern analysis</span>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle>🛡️ SMS/Alert Fraud Detection Guide</CardTitle>
          <CardDescription>Received a suspicious transaction alert? Use this expert guide to analyze it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Immediate Red Flags</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Unknown merchant or suspicious UPI ID</li>
              <li>• Urgent language: "Click immediately to cancel"</li>
              <li>• Links in SMS asking for OTP/passwords</li>
              <li>• Transactions you didn't initiate</li>
              <li>• Odd timing (late night, unusual amounts)</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">✅ Safe Verification Steps</h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal ml-4">
              <li>Open your official bank app (not from the SMS link)</li>
              <li>Check your account statement/transaction history</li>
              <li>Call your bank using the number on your card back</li>
              <li>Never click links in suspicious SMS messages</li>
              <li>Block the transaction through your bank if unauthorized</li>
            </ol>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">🔍 Transaction ID Analysis</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Genuine transaction IDs usually follow bank-specific patterns (e.g., "TXN20245123456", "UPI1234567890"). 
              Random letter combinations or suspicious formats may indicate fraud.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle>🔍 Intelligent Transaction Analysis</CardTitle>
          <CardDescription>
            Advanced system with dynamic field adaptation • Auto-detects identifier types • Behavioral pattern analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Core Transaction Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Transaction Amount *</Label>
                <Input 
                  id="amount"
                  type="number" 
                  value={form.Amount}
                  onChange={(e) => setForm({ ...form, Amount: Number(e.target.value) })} 
                  required 
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timestamp">Date & Time *</Label>
                <Input 
                  id="timestamp"
                  type="datetime-local" 
                  value={form.Timestamp}
                  onChange={(e) => setForm({ ...form, Timestamp: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Dynamic Identifier Selection */}
            <div className="space-y-4">
              <Label>Transaction Identifier (System adapts to your data structure)</Label>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableIdentifiers().map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={identifierType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIdentifierType(type as any)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              <Input
                placeholder={`Enter ${identifierType}`}
                value={form[identifierType]}
                onChange={(e) => setForm({ ...form, [identifierType]: e.target.value })}
              />
            </div>

            {/* Additional Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location/Region</Label>
                <Input 
                  id="location"
                  value={form.Location}
                  onChange={(e) => setForm({ ...form, Location: e.target.value })} 
                  placeholder="e.g., Delhi, Mumbai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionType">Transaction Type *</Label>
                <select 
                  id="transactionType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                  value={form.TransactionType}
                  onChange={(e) => setForm({ ...form, TransactionType: e.target.value })} 
                  required
                >
                  {(encoders?.transTypeVocab ?? ["P2P","Merchant","BillPay","Recharge","Transfer","Online","ATM"]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Analysis Button and Results */}
            <div className="space-y-4">
              <Button type="submit" disabled={isAnalyzing || !model} className="w-full" size="lg">
                {isAnalyzing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Transaction...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Analyze for Fraud
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg border-2 ${
                  result.label === 'Fraud' 
                    ? 'border-destructive/20 bg-destructive/5' 
                    : 'border-green-200 bg-green-50 dark:bg-green-900/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.label === 'Fraud' ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Shield className="w-5 h-5 text-green-600" />
                      )}
                      <span className={`font-semibold ${
                        result.label === 'Fraud' ? 'text-destructive' : 'text-green-600'
                      }`}>
                        {result.label}
                      </span>
                    </div>
                    <Badge variant={result.risk === 'HIGH' ? 'destructive' : result.risk === 'MEDIUM' ? 'secondary' : 'default'}>
                      Risk: {result.risk}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Confidence Score: <span className="font-medium">{result.confidence}%</span></p>
                    <p>Fraud Probability: <span className="font-medium">{(result.prob * 100).toFixed(1)}%</span></p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictPage;
