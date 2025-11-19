import React, { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useML } from "@/context/MLContext";
import UserGuideOverlay from "@/components/UserGuideOverlay";
import { HelpCircle } from "lucide-react";

const Index: React.FC = () => {
  const { loadSampleDataset } = useML();
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <div className="relative overflow-hidden rounded-xl border surface-elevated">
      <div
        ref={areaRef}
        onMouseMove={onMove}
        className="relative px-6 py-16 sm:px-12 sm:py-20 grid gap-8 text-center content-overlay"
        style={{
          background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, hsl(var(--primary) / 0.1), hsl(var(--background) / 0.85) 60%)`,
        }}
      >
        <header>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">UPI Fraud Detection Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload datasets, train a machine learning model directly in your browser, and monitor live predictions and analytics — all in one place.
          </p>
        </header>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild variant="hero" size="lg">
            <Link to="/upload">Upload Dataset</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/train" onClick={loadSampleDataset}>Use Sample & Train</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/predict">Try Manual Prediction</Link>
          </Button>
        </div>

        {/* Need More Info Section */}
        <div className="mt-6">
          <Button
            onClick={() => setIsGuideOpen(true)}
            variant="outline"
            size="lg"
            className="bg-background/20 backdrop-blur-sm border-primary/30 hover:bg-background/30"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Need More Info?
          </Button>
        </div>

        <section className="grid sm:grid-cols-3 gap-4 text-left mt-6">
          <Card className="surface-elevated hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  📊
                </div>
                Dataset Upload & Preview
              </CardTitle>
              <CardDescription>CSV with columns: TransactionID, UserID, Amount, Timestamp, Location, DeviceID, TransactionType, FraudLabel</CardDescription>
            </CardHeader>
          </Card>
          <Card className="surface-elevated hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  🧠
                </div>
                Advanced ML Models
              </CardTitle>
              <CardDescription>Logistic Regression & Random Forest using TensorFlow.js with comprehensive metrics: Accuracy, Precision, Recall, F1</CardDescription>
            </CardHeader>
          </Card>
          <Card className="surface-elevated hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  📈
                </div>
                Live Stream & Analytics
              </CardTitle>
              <CardDescription>Real-time fraud detection, interactive dashboards, and comprehensive analytics with anomaly detection</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
      
      <UserGuideOverlay isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export default Index;
