import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useML } from "@/context/MLContext";

interface StreamRow {
  id: string;
  amount: number;
  time: string;
  type: string;
  pred: 'Fraud' | 'Genuine';
  prob: number;
}

const StreamPage: React.FC = () => {
  const { dataset, predictRow, model, loadSampleDataset } = useML();
  const [playing, setPlaying] = useState(false);
  const [rows, setRows] = useState<StreamRow[]>([]);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    document.title = "Real-Time Stream | UPI Fraud Detection";
  }, []);

  const start = () => {
    if (!model || dataset.length === 0 || playing) return;
    setPlaying(true);
    timerRef.current = window.setInterval(async () => {
      const r = dataset[idxRef.current % dataset.length];
      idxRef.current++;
      const pred = await predictRow({
        Amount: r.Amount,
        Timestamp: r.Timestamp,
        Location: r.Location,
        DeviceID: r.DeviceID,
        TransactionType: r.TransactionType,
      } as any);
      setRows((prev) => [{ id: r.TransactionID || String(idxRef.current), amount: r.Amount, time: r.Timestamp, type: r.TransactionType, pred: pred.label, prob: pred.prob }, ...prev].slice(0, 50));
    }, 2000);
  };

  const stop = () => {
    setPlaying(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Real-Time Transaction Stream</h1>
        <p className="text-muted-foreground">Simulate live predictions every few seconds from the loaded dataset.</p>
      </header>

      {!model && (
        <Card>
          <CardHeader>
            <CardTitle>Model not ready</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="hero" asChild>
              <Link to="/train">Train Model</Link>
            </Button>
            <Button variant="secondary" onClick={loadSampleDataset}>Load Sample Dataset</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={start} disabled={!model || playing} variant="hero">Start</Button>
        <Button onClick={stop} disabled={!playing} variant="secondary">Stop</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">TransactionID</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Prediction</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`border-b last:border-b-0 ${r.pred === 'Fraud' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                    <td className="py-2 pr-4">{r.id}</td>
                    <td className="py-2 pr-4">₹{r.amount.toFixed(2)}</td>
                    <td className="py-2 pr-4">{new Date(r.time).toLocaleString()}</td>
                    <td className="py-2 pr-4">{r.type}</td>
                    <td className={`py-2 pr-4 font-medium ${r.pred === 'Fraud' ? 'text-destructive' : 'text-success'}`}>
                      {r.pred} ({(r.prob * 100).toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamPage;
