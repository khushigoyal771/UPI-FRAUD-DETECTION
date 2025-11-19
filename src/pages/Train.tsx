import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useML } from "@/context/MLContext";

const TrainPage: React.FC = () => {
  const { dataset, metrics, isTraining, trainModel, encoders, loadSampleDataset } = useML();

  useEffect(() => {
    document.title = "Train Model | UPI Fraud Detection";
  }, []);

  const canTrain = dataset.length > 0 && encoders;

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Model Training</h1>
        <p className="text-muted-foreground">Train a Logistic Regression model (TF.js) on your dataset.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dataset</CardTitle>
          <CardDescription>{dataset.length > 0 ? `${dataset.length} rows loaded` : "No dataset loaded yet."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="hero" disabled={!canTrain || isTraining} onClick={() => trainModel("logistic")}>
              {isTraining ? "Training..." : "Train Logistic Regression"}
            </Button>
            <Button variant="secondary" disabled={!canTrain || isTraining} onClick={() => trainModel("random_forest")}>
              {isTraining ? "Training..." : "Train Random Forest"}
            </Button>
            {dataset.length === 0 && (
              <Button variant="outline" onClick={loadSampleDataset}>Load Sample</Button>
            )}
          </div>
          {metrics?.modelType && (
            <p className="text-sm text-muted-foreground">
              Current model: {metrics.modelType === "random_forest" ? "Random Forest" : "Logistic Regression"}
            </p>
          )}
        </CardContent>
      </Card>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Training Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-4 gap-4">
              <li className="p-4 rounded-md bg-accent">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-semibold">{(metrics.accuracy * 100).toFixed(1)}%</p>
              </li>
              <li className="p-4 rounded-md bg-accent">
                <p className="text-sm text-muted-foreground">Precision</p>
                <p className="text-2xl font-semibold">{(metrics.precision * 100).toFixed(1)}%</p>
              </li>
              <li className="p-4 rounded-md bg-accent">
                <p className="text-sm text-muted-foreground">Recall</p>
                <p className="text-2xl font-semibold">{(metrics.recall * 100).toFixed(1)}%</p>
              </li>
              <li className="p-4 rounded-md bg-accent">
                <p className="text-sm text-muted-foreground">F1-score</p>
                <p className="text-2xl font-semibold">{(metrics.f1 * 100).toFixed(1)}%</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainPage;
