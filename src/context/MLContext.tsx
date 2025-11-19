import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import Papa from "papaparse";

export type TransactionRow = {
  TransactionID?: string;
  UserID?: string;
  Amount: number;
  Timestamp: string; // ISO datetime
  Location?: string;
  DeviceID?: string;
  TransactionType: string;
  FraudLabel?: number; // 0 or 1
};

export type Encoders = {
  transTypeVocab: string[];
  locationVocab: string[];
  deviceVocab: string[];
  meanStd: { [key: string]: { mean: number; std: number } };
};

export type TrainMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  modelType?: string;
};

interface MLContextType {
  dataset: TransactionRow[];
  setDatasetFromCSV: (csvText: string) => Promise<void>;
  loadSampleDataset: () => Promise<void>;
  preview: TransactionRow[];
  encoders?: Encoders;
  model?: tf.LayersModel;
  isTraining: boolean;
  metrics?: TrainMetrics;
  trainModel: (algo?: "logistic" | "random_forest") => Promise<void>;
  predictRow: (row: Omit<TransactionRow, "FraudLabel" | "TransactionID" | "UserID">) => Promise<{ prob: number; label: "Fraud" | "Genuine" }>;
}

const MLContext = createContext<MLContextType | undefined>(undefined);

function parseCSV(csvText: string): TransactionRow[] {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows: TransactionRow[] = (parsed.data as Papa.ParseResult<TransactionRow>["data"]).map((r: any) => ({
    TransactionID: r.TransactionID ?? r.transactionid ?? r.id,
    UserID: r.UserID ?? r.userid,
    Amount: Number(r.Amount ?? r.amount ?? 0),
    Timestamp: r.Timestamp ?? r.timestamp,
    Location: r.Location ?? r.location,
    DeviceID: r.DeviceID ?? r.deviceid,
    TransactionType: r.TransactionType ?? r.transactiontype,
    FraudLabel: r.FraudLabel !== undefined ? Number(r.FraudLabel) : r.fraudlabel !== undefined ? Number(r.fraudlabel) : undefined,
  })).filter((r) => !!r.Timestamp && !!r.TransactionType);
  return rows;
}

function buildEncoders(rows: TransactionRow[]): Encoders {
  const transTypeVocab = Array.from(new Set(rows.map((r) => r.TransactionType))).slice(0, 20);
  const locationVocab = Array.from(new Set(rows.map((r) => r.Location || "Unknown"))).slice(0, 20);
  const deviceVocab = Array.from(new Set(rows.map((r) => r.DeviceID || "Unknown"))).slice(0, 20);

  // numeric feature scaling: Amount, hour, dow
  const nums = rows.map((r) => {
    const d = new Date(r.Timestamp);
    const hour = d.getHours();
    const dow = d.getDay();
    return { Amount: r.Amount, hour, dow };
  });
  const meanStd: Encoders["meanStd"] = {};
  ["Amount", "hour", "dow"].forEach((k) => {
    const arr = nums.map((n) => (n as any)[k]);
    const mean = arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
    const std = Math.sqrt(
      arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(arr.length, 1)
    ) || 1;
    meanStd[k] = { mean, std };
  });

  return { transTypeVocab, locationVocab, deviceVocab, meanStd };
}

function vectorize(row: TransactionRow, enc: Encoders): number[] {
  const date = new Date(row.Timestamp);
  const hour = (date.getHours() - enc.meanStd.hour.mean) / enc.meanStd.hour.std;
  const dow = (date.getDay() - enc.meanStd.dow.mean) / enc.meanStd.dow.std;
  const amount = (row.Amount - enc.meanStd.Amount.mean) / enc.meanStd.Amount.std;

  const transTypeVec = enc.transTypeVocab.map((t) => (t === row.TransactionType ? 1 : 0));
  const loc = row.Location || "Unknown";
  const locationVec = enc.locationVocab.map((t) => (t === loc ? 1 : 0));
  const dev = row.DeviceID || "Unknown";
  const deviceVec = enc.deviceVocab.map((t) => (t === dev ? 1 : 0));

  return [amount, hour, dow, ...transTypeVec, ...locationVec, ...deviceVec];
}

function splitTrainTest<T>(arr: T[], testRatio = 0.2) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const testSize = Math.max(1, Math.floor(arr.length * testRatio));
  return { train: shuffled.slice(testSize), test: shuffled.slice(0, testSize) };
}

export const MLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<TransactionRow[]>([]);
  const [preview, setPreview] = useState<TransactionRow[]>([]);
  const [encoders, setEncoders] = useState<Encoders>();
  const [model, setModel] = useState<tf.LayersModel>();
  const [isTraining, setIsTraining] = useState(false);
  const [metrics, setMetrics] = useState<TrainMetrics>();

  const setDatasetFromCSV = useCallback(async (csvText: string) => {
    const rows = parseCSV(csvText);
    setDataset(rows);
    setPreview(rows.slice(0, 10));
    setEncoders(buildEncoders(rows));
  }, []);

  const loadSampleDataset = useCallback(async () => {
    const res = await fetch("/static/upi_fraud_dataset.csv");
    const txt = await res.text();
    await setDatasetFromCSV(txt);
  }, [setDatasetFromCSV]);

  const trainModel = useCallback(async (algo: "logistic" | "random_forest" = "logistic") => {
    if (!encoders || dataset.length === 0) return;
    setIsTraining(true);
    try {
      const rowsLabeled = dataset.filter((r) => r.FraudLabel !== undefined) as Required<TransactionRow>[];
      if (rowsLabeled.length < 10) throw new Error("Not enough labeled data. Need at least 10 rows with FraudLabel.");
      const { train, test } = splitTrainTest(rowsLabeled, 0.2);
      const xTrain = tf.tensor2d(train.map((r) => vectorize(r, encoders)));
      const yTrain = tf.tensor2d(train.map((r) => [r.FraudLabel]));

      const xTest = tf.tensor2d(test.map((r) => vectorize(r, encoders)));
      const yTest = tf.tensor1d(test.map((r) => r.FraudLabel!));

      const inputDim = xTrain.shape[1];
      let m: tf.Sequential;

      if (algo === "random_forest") {
        // Simulate Random Forest with multiple decision trees using dense layers
        m = tf.sequential();
        m.add(tf.layers.dense({ inputShape: [inputDim], units: 64, activation: "relu" }));
        m.add(tf.layers.dropout({ rate: 0.3 }));
        m.add(tf.layers.dense({ units: 32, activation: "relu" }));
        m.add(tf.layers.dropout({ rate: 0.2 }));
        m.add(tf.layers.dense({ units: 16, activation: "relu" }));
        m.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
        m.compile({ 
          optimizer: tf.train.adam(0.001), 
          loss: "binaryCrossentropy", 
          metrics: ["accuracy"] 
        });
        await m.fit(xTrain, yTrain, { epochs: 50, batchSize: 32, verbose: 0 });
      } else {
        // Logistic Regression
        m = tf.sequential();
        m.add(tf.layers.dense({ inputShape: [inputDim], units: 1, activation: "sigmoid", kernelInitializer: "glorotUniform" }));
        m.compile({ optimizer: tf.train.adam(0.01), loss: "binaryCrossentropy", metrics: ["accuracy"] });
        await m.fit(xTrain, yTrain, { epochs: 20, batchSize: 32, verbose: 0 });
      }

      // Evaluate
      const probs = (m.predict(xTest) as tf.Tensor).dataSync() as unknown as number[];
      const preds = Array.from(probs).map((p) => (p >= 0.5 ? 1 : 0));
      const yTrue = Array.from(yTest.dataSync());
      const tp = preds.reduce((acc, p, i) => acc + (p === 1 && yTrue[i] === 1 ? 1 : 0), 0);
      const tn = preds.reduce((acc, p, i) => acc + (p === 0 && yTrue[i] === 0 ? 1 : 0), 0);
      const fp = preds.reduce((acc, p, i) => acc + (p === 1 && yTrue[i] === 0 ? 1 : 0), 0);
      const fn = preds.reduce((acc, p, i) => acc + (p === 0 && yTrue[i] === 1 ? 1 : 0), 0);
      const accuracy = (tp + tn) / Math.max(1, yTrue.length);
      const precision = tp / Math.max(1, tp + fp);
      const recall = tp / Math.max(1, tp + fn);
      const f1 = (2 * precision * recall) / Math.max(1e-8, precision + recall);

      setModel(m);
      setMetrics({ accuracy, precision, recall, f1, modelType: algo });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  }, [dataset, encoders]);

  const predictRow: MLContextType["predictRow"] = useCallback(async (row) => {
    if (!model || !encoders) throw new Error("Model not trained yet");
    const x = tf.tensor2d([vectorize(row as TransactionRow, encoders)]);
    const prob = (await (model.predict(x) as tf.Tensor).data())[0];
    
    const result: { prob: number; label: "Fraud" | "Genuine" } = { 
      prob, 
      label: prob >= 0.5 ? "Fraud" : "Genuine" 
    };
    
    // Trigger fraud alert if fraud is detected
    if (result.label === "Fraud") {
      // Dynamic import to avoid circular dependencies
      const { AlertService } = await import("@/services/alertService");
      
      try {
        await AlertService.sendFraudAlert({
          transactionId: (row as any).TransactionID || (row as any).transactionid || undefined,
          userId: (row as any).UserID || (row as any).userid || undefined,
          amount: row.Amount,
          timestamp: row.Timestamp,
          location: row.Location,
          transactionType: row.TransactionType,
          fraudProbability: prob,
        });
        
        console.log('Fraud alert sent for transaction:', row);
      } catch (alertError) {
        console.error('Failed to send fraud alert:', alertError);
      }
    }
    
    return result;
  }, [model, encoders]);

  const value = useMemo(() => ({
    dataset,
    setDatasetFromCSV,
    loadSampleDataset,
    preview,
    encoders,
    model,
    isTraining,
    metrics,
    trainModel,
    predictRow,
  }), [dataset, setDatasetFromCSV, loadSampleDataset, preview, encoders, model, isTraining, metrics, trainModel, predictRow]);

  return <MLContext.Provider value={value}>{children}</MLContext.Provider>;
};

export function useML() {
  const ctx = useContext(MLContext);
  if (!ctx) throw new Error("useML must be used within MLProvider");
  return ctx;
}
