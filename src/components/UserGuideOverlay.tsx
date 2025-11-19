import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, Brain, Target, TrendingUp } from "lucide-react";

interface UserGuideOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuideOverlay: React.FC<UserGuideOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: Upload,
      title: "Upload Dataset",
      description: "Upload your CSV file with transaction data or use our sample dataset to get started instantly.",
      details: "Supports columns: TransactionID, UserID, Amount, Timestamp, Location, DeviceID, TransactionType, FraudLabel",
      color: "text-blue-600"
    },
    {
      icon: Brain,
      title: "Train Advanced Models",
      description: "Choose between Logistic Regression and Random Forest models, both running directly in your browser using TensorFlow.js.",
      details: "View comprehensive metrics: Accuracy, Precision, Recall, F1-score, with model comparison",
      color: "text-green-600"
    },
    {
      icon: Target,
      title: "Make Predictions",
      description: "Test individual transactions with explainable AI features and analyze patterns to detect potential fraud.",
      details: "Get confidence scores, detailed fraud risk analysis, and explanations for predictions",
      color: "text-orange-600"
    },
    {
      icon: TrendingUp,
      title: "Monitor & Analyze",
      description: "View live transaction streams, comprehensive analytics dashboards, and anomaly detection results.",
      details: "Real-time fraud detection with interactive charts, alerts, and visual insights",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">How It Works</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <p className="text-muted-foreground mb-8 text-center">
            Follow these simple steps to detect UPI fraud using machine learning
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden surface-elevated hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
                <div className="absolute top-3 right-3 w-10 h-10 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {index + 1}
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-primary rounded-xl shadow-md">
                      <step.icon className={`h-6 w-6 text-white`} />
                    </div>
                    <CardTitle className="text-lg font-heading">{step.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {step.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>💡</span>
              <span>Pro Tip: You can highlight any text on the page and click "Explain" for instant help!</span>
            </div>
            <Button onClick={onClose} size="lg" variant="hero" className="shadow-lg">
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuideOverlay;